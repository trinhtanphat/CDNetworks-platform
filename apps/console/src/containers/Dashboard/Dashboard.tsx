import { useEffect, useState } from 'react';
import {
  Card, Col, Row, Statistic, Tag, Space, Select, Table, Progress, Alert, Button,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, GlobalOutlined, SafetyOutlined,
  ThunderboltOutlined, CloudDownloadOutlined,
} from '@ant-design/icons';

/**
 * Dashboard giống console.cdnetworks.com/cdn/dashboard:
 *  - Bộ chọn timeframe (1h / 24h / 7d / 30d)
 *  - 4 KPI cards
 *  - Traffic chart + status donut không cần dependency chart ngoài
 *  - Top 10 hostnames table
 *  - Real-time security incidents
 */
export default function Dashboard() {
  const [range, setRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Space direction="vertical" size={0}>
          <h2 style={{ margin: 0 }}>CDN Pro · Dashboard</h2>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            Last updated: {now.toLocaleTimeString()} · auto-refresh 30s
          </span>
        </Space>
        <Space>
          <Select
            value={range}
            onChange={setRange}
            style={{ width: 140 }}
            options={[
              { label: 'Last 1 hour',   value: '1h' },
              { label: 'Last 24 hours', value: '24h' },
              { label: 'Last 7 days',   value: '7d' },
              { label: 'Last 30 days',  value: '30d' },
            ]}
          />
          <Button icon={<CloudDownloadOutlined />}>Export CSV</Button>
        </Space>
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Tip"
        description="3 cache rules mới được merge từ staging. Vào Edge Configurations → Cache Rules để review."
        closable
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Bandwidth" value={3.42} precision={2} suffix="TB"
              prefix={<ThunderboltOutlined />} valueStyle={{ color: '#0a4cff' }} />
            <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>
              <ArrowUpOutlined /> +12.4% vs prev
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Requests" value={128_932_103} prefix={<GlobalOutlined />} />
            <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>
              <ArrowUpOutlined /> +8.1%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Cache Hit Ratio" value={94.7} precision={1} suffix="%"
              valueStyle={{ color: '#10b981' }} prefix={<ArrowUpOutlined />} />
            <Progress percent={94.7} showInfo={false} strokeColor="#10b981" size="small" style={{ marginTop: 4 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Attacks blocked" value={1284} prefix={<SafetyOutlined />}
              valueStyle={{ color: '#ef4444' }} />
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
              <ArrowDownOutlined /> -3.2%
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Traffic by region" extra={<Tag color="blue">{range}</Tag>}>
            <TrafficLineChart range={range} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Status code mix">
            <StatusCodeDonut />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Top 10 Hostnames">
            <Table
              size="small"
              pagination={false}
              rowKey="host"
              dataSource={[
                { host: 'www.example.com',    req: 56_312_220, hit: 95.1, bw: '1.42 TB' },
                { host: 'static.example.com', req: 42_001_004, hit: 98.7, bw: '0.91 TB' },
                { host: 'api.example.com',    req: 18_440_100, hit: 22.3, bw: '0.21 TB' },
                { host: 'cdn.example.com',    req: 12_178_779, hit: 99.4, bw: '0.88 TB' },
              ]}
              columns={[
                { title: 'Hostname',  dataIndex: 'host' },
                { title: 'Requests',  dataIndex: 'req', render: (n: number) => n.toLocaleString() },
                { title: 'Hit %',     dataIndex: 'hit', render: (n: number) => `${n}%` },
                { title: 'Bandwidth', dataIndex: 'bw' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Security incidents (latest 5)">
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={[
                { id: 1, type: 'WAF',  rule: 'SQLi-001', ip: '203.0.113.10', action: 'BLOCK' },
                { id: 2, type: 'Bot',  rule: 'BOT-FP',   ip: '198.51.100.7', action: 'CHALLENGE' },
                { id: 3, type: 'DDoS', rule: 'L7-FLOOD', ip: '203.0.113.55', action: 'BLOCK' },
                { id: 4, type: 'WAF',  rule: 'XSS-022',  ip: '198.51.100.4', action: 'BLOCK' },
                { id: 5, type: 'API',  rule: 'RL-AUTH',  ip: '203.0.113.99', action: 'RATE_LIMIT' },
              ]}
              columns={[
                { title: 'Type',   dataIndex: 'type', render: (v: string) => <Tag color="purple">{v}</Tag> },
                { title: 'Rule',   dataIndex: 'rule' },
                { title: 'Source', dataIndex: 'ip' },
                { title: 'Action', dataIndex: 'action', render: (v: string) =>
                  <Tag color={v === 'BLOCK' ? 'red' : 'orange'}>{v}</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

const regionSeries = [
  { region: 'APAC', color: '#0a4cff', values: [42, 48, 51, 56, 63, 69, 76, 82, 88, 93, 97, 104] },
  { region: 'Europe', color: '#10b981', values: [28, 31, 37, 41, 43, 52, 58, 61, 66, 70, 73, 79] },
  { region: 'North America', color: '#f97316', values: [35, 39, 44, 48, 55, 57, 59, 63, 71, 76, 78, 84] },
  { region: 'South America', color: '#8b5cf6', values: [12, 14, 17, 20, 23, 24, 27, 29, 33, 35, 38, 41] },
];

function TrafficLineChart({ range }: { range: string }) {
  const width = 760;
  const height = 220;
  const padding = 28;
  const max = Math.max(...regionSeries.flatMap((s) => s.values));
  const xStep = (width - padding * 2) / (regionSeries[0].values.length - 1);

  const pathFor = (values: number[]) => values
    .map((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div style={{ height: 260 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" role="img" aria-label={`Traffic line chart ${range}`}>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} className="cdn-chart-grid" x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        <line className="cdn-chart-axis" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        {regionSeries.map((series) => (
          <g key={series.region}>
            <path d={pathFor(series.values)} fill="none" stroke={series.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {series.values.map((value, index) => {
              const x = padding + index * xStep;
              const y = height - padding - (value / max) * (height - padding * 2);
              return <circle key={`${series.region}-${index}`} cx={x} cy={y} r="3" fill={series.color} />;
            })}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {regionSeries.map((series) => (
          <span key={series.region} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: series.color }} />
            {series.region} · {series.values.at(-1)} Gbps
          </span>
        ))}
      </div>
    </div>
  );
}

const statusMix = [
  { label: '2xx', value: 92.4, color: '#10b981' },
  { label: '3xx', value: 4.2, color: '#0a4cff' },
  { label: '4xx', value: 2.8, color: '#f97316' },
  { label: '5xx', value: 0.6, color: '#ef4444' },
];

function StatusCodeDonut() {
  let start = 0;
  const gradient = statusMix.map((item) => {
    const end = start + item.value;
    const part = `${item.color} ${start}% ${end}%`;
    start = end;
    return part;
  }).join(', ');

  return (
    <div style={{ height: 260, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, alignItems: 'center' }}>
      <div
        role="img"
        aria-label="2xx 3xx 4xx 5xx donut"
        style={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `conic-gradient(${gradient})`,
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'inset 0 0 0 18px #fff, 0 10px 24px rgba(15,23,42,0.08)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>99.4%</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>success</div>
        </div>
      </div>
      <Space direction="vertical" size={8}>
        {statusMix.map((item) => (
          <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '12px 42px 1fr', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: item.color }} />
            <strong>{item.label}</strong>
            <span style={{ color: '#64748b' }}>{item.value}%</span>
          </div>
        ))}
      </Space>
    </div>
  );
}
