-- =============================================================================
-- CDNetworks Platform — ClickHouse bootstrap (Analytics / OLAP).
-- Access logs raw + Materialized Views aggregate cho billing & dashboard.
-- =============================================================================

-- ============================ RAW ACCESS LOGS ================================
CREATE TABLE IF NOT EXISTS access_logs
(
    timestamp     DateTime64(3)  CODEC(DoubleDelta, ZSTD(3)),
    tenant_id     LowCardinality(String),
    host          LowCardinality(String),
    edge_node     LowCardinality(String),
    method        LowCardinality(String),
    uri           String,
    status        UInt16,
    bytes_sent    UInt64,
    request_time  Float32,
    upstream_time Float32,
    cache_status  LowCardinality(String),  -- HIT | MISS | EXPIRED | BYPASS
    client_ip_hash FixedString(16),         -- SipHash của IP để PII-safe
    country_code  LowCardinality(String),
    user_agent_hash UInt64,
    referer_host  LowCardinality(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (tenant_id, host, timestamp)
TTL toDateTime(timestamp) + INTERVAL 14 DAY DELETE
SETTINGS index_granularity = 8192;

-- ============================ KAFKA INGESTION ================================
-- Edge Nodes ghi log → Vector/FluentBit → Kafka → ClickHouse Kafka engine.
CREATE TABLE IF NOT EXISTS access_logs_kafka
(
    timestamp     DateTime64(3),
    tenant_id     String,
    host          String,
    edge_node     String,
    method        String,
    uri           String,
    status        UInt16,
    bytes_sent    UInt64,
    request_time  Float32,
    upstream_time Float32,
    cache_status  String,
    client_ip_hash FixedString(16),
    country_code  String,
    user_agent_hash UInt64,
    referer_host  String
)
ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'kafka:9092',
    kafka_topic_list = 'cdn.access_logs',
    kafka_group_name = 'clickhouse-access-logs',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 2,
    kafka_max_block_size = 100000;

CREATE MATERIALIZED VIEW IF NOT EXISTS access_logs_mv TO access_logs AS
SELECT * FROM access_logs_kafka;

-- ============================ AGGREGATIONS (BILLING) =========================
-- Hourly bandwidth per tenant + host → Billing engine query view này.
CREATE TABLE IF NOT EXISTS bandwidth_hourly
(
    tenant_id     LowCardinality(String),
    host          LowCardinality(String),
    hour          DateTime,
    total_requests UInt64,
    total_bytes    UInt64,
    cache_hits     UInt64,
    error_5xx      UInt64
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(hour)
ORDER BY (tenant_id, host, hour);

CREATE MATERIALIZED VIEW IF NOT EXISTS bandwidth_hourly_mv
TO bandwidth_hourly AS
SELECT
    tenant_id,
    host,
    toStartOfHour(timestamp) AS hour,
    count() AS total_requests,
    sum(bytes_sent) AS total_bytes,
    sumIf(1, cache_status = 'HIT') AS cache_hits,
    sumIf(1, status >= 500) AS error_5xx
FROM access_logs
GROUP BY tenant_id, host, hour;

-- ============================ DAILY ROLLUP ==================================
CREATE TABLE IF NOT EXISTS bandwidth_daily
(
    tenant_id     LowCardinality(String),
    host          LowCardinality(String),
    day           Date,
    total_requests UInt64,
    total_bytes    UInt64,
    cache_hits     UInt64,
    error_5xx      UInt64
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (tenant_id, host, day);

CREATE MATERIALIZED VIEW IF NOT EXISTS bandwidth_daily_mv
TO bandwidth_daily AS
SELECT
    tenant_id, host, toDate(hour) AS day,
    sum(total_requests) AS total_requests,
    sum(total_bytes)    AS total_bytes,
    sum(cache_hits)     AS cache_hits,
    sum(error_5xx)      AS error_5xx
FROM bandwidth_hourly
GROUP BY tenant_id, host, day;
