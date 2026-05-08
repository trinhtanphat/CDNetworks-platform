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
 *  - Chart row (placeholder — production gắn @ant-design/charts)
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
            <ChartPlaceholder label="Traffic line chart" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Status code mix">
            <ChartPlaceholder label="2xx / 3xx / 4xx / 5xx donut" />
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

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        height: 220,
        background: 'repeating-linear-gradient(45deg, #f8fafc 0 8px, #f1f5f9 8px 16px)',
        borderRadius: 8, display: 'grid', placeItems: 'center',
        color: '#64748b', fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}
