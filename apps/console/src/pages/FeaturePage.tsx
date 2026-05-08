import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Card, Col, Descriptions, Empty, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { CloudSyncOutlined, DownloadOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

type FeatureDef = {
  title: string;
  product: string;
  description: string;
  primaryAction?: string;
  stats: { label: string; value: string; tone?: 'green' | 'blue' | 'orange' | 'red' }[];
  columns: string[];
  rows: Record<string, string | number>[];
};

const featureMap: Record<string, FeatureDef> = {
  '/reports/traffic': feature('Traffic Report', 'CDN Pro', 'Bandwidth, requests, cache ratio, and peak traffic by hostname.', 'Export report', ['Hostname', 'Bandwidth', 'Requests', 'Hit Ratio', 'Peak RPS']),
  '/reports/visitor': feature('Visitor Analytics', 'CDN Pro', 'Visitor distribution by country, ISP, device, and browser.', 'Export visitors', ['Region', 'Visitors', 'Requests', 'Bounce', 'Threats']),
  '/reports/resource': feature('Resource Report', 'CDN Pro', 'Top URLs, file types, object size, and origin offload efficiency.', 'Download CSV', ['Resource', 'Requests', 'Bandwidth', 'Cache', 'Origin']),
  '/reports/probe': feature('Synthetic Probe', 'CDN Pro', 'Global probe latency and availability from monitoring regions.', 'Run probe', ['Probe', 'Region', 'Latency', 'Availability', 'Status']),
  '/edge-configurations/properties': feature('Properties', 'CDN Pro', 'Manage accelerated hostnames, origins, certificates, and deployment status.', 'Add property', ['Hostname', 'Origin', 'Plan', 'Status', 'Updated']),
  '/edge-configurations/cache-rules': feature('Cache Rules', 'CDN Pro', 'Create path-aware cache TTL, bypass, stale, and browser cache policies.', 'Create rule', ['Rule', 'Match', 'TTL', 'Status', 'Priority']),
  '/edge-configurations/origin': feature('Origin Settings', 'CDN Pro', 'Origin pools, failover, health checks, connection reuse, and origin shield.', 'Add origin', ['Origin', 'Protocol', 'Health', 'Shield', 'Weight']),
  '/edge-configurations/headers': feature('Custom Headers', 'CDN Pro', 'Add, remove, or normalize request/response headers at the edge.', 'Add header rule', ['Rule', 'Direction', 'Header', 'Action', 'Status']),
  '/traffic/dns': feature('Traffic DNS', 'CDN Pro', 'Smart routing, DNS steering, latency policy, and failover rules.', 'Create policy', ['Policy', 'Type', 'Regions', 'Health', 'Status']),
  '/traffic/loadbalancer': feature('Load Balancer', 'CDN Pro', 'Origin pool balancing with weighted, least-latency, and failover modes.', 'Create load balancer', ['Pool', 'Mode', 'Origins', 'Failover', 'Status']),
  '/traffic/geo': feature('Geo Routing', 'CDN Pro', 'Route users to specific origin pools based on country, ASN, or region.', 'Create geo rule', ['Rule', 'Countries', 'Target', 'Priority', 'Status']),
  '/origin-logs': feature('Origin Logs', 'CDN Pro', 'Origin fetch logs with cache miss reasons, origin latency, and response codes.', 'Export logs', ['Time', 'Hostname', 'Origin', 'Status', 'Latency']),
  '/audit-logs': feature('Audit Logs', 'CDN Pro', 'Tenant activity trail for configuration changes, user actions, API keys, and login events.', 'Export audit', ['Time', 'Actor', 'Action', 'Resource', 'IP']),
  '/ssl/certificates': feature('SSL Certificates', 'CDN Pro', 'Managed certificates, uploaded certificates, expiry monitoring, and SNI binding.', 'Upload certificate', ['Hostname', 'Issuer', 'Expiry', 'Auto Renew', 'Status']),
  '/ssl/auto-renew': feature('Auto Renew', 'CDN Pro', 'Automated certificate renewal windows, DNS validation, and renewal history.', 'Configure renew', ['Hostname', 'Method', 'Next Renew', 'Attempts', 'Status']),
  '/api-keys': feature('API Keys', 'CDN Pro', 'Scoped API keys for automation, CI/CD, Terraform, and log download jobs.', 'Create API key', ['Name', 'Scopes', 'Preview', 'Last Used', 'Status']),
  '/tools/purge': feature('Purge & Prefetch', 'CDN Pro', 'Instant purge, directory purge, tag purge, and prefetch jobs for hot content.', 'Create purge job', ['Job', 'Type', 'Objects', 'Progress', 'Status']),
  '/shield/dashboard': feature('Application Shield Dashboard', 'Application Shield', 'WAF, bot, API protection, managed rules, and attack timeline.', 'Open events', ['Metric', 'Blocked', 'Challenge', 'Allowed', 'Trend']),
  '/shield/waf-rules': feature('WAF Rules', 'Application Shield', 'Managed OWASP rules, custom rules, exceptions, and sensitivity tuning.', 'Create WAF rule', ['Rule', 'Match', 'Action', 'Mode', 'Status']),
  '/shield/bot-management': feature('Bot Management', 'Application Shield', 'Detect automation, credential stuffing, scraper traffic, and good bots.', 'Create bot rule', ['Bot Class', 'Score', 'Requests', 'Action', 'Status']),
  '/shield/api-protection': feature('API Protection', 'Application Shield', 'Schema validation, JWT checks, endpoint rate limits, and discovery.', 'Import OpenAPI', ['Endpoint', 'Method', 'Auth', 'Rate Limit', 'Status']),
  '/shield/events': feature('Security Events', 'Application Shield', 'Searchable WAF/Bot/API events with source IP, rule ID, and action.', 'Export events', ['Time', 'Source', 'Rule', 'Action', 'Country']),
  '/flood/dashboard': feature('Flood Shield Dashboard', 'Flood Shield', 'L3/L4/L7 DDoS posture, mitigation status, and attack traffic trends.', 'View incidents', ['Vector', 'Peak', 'Duration', 'Mitigation', 'Status']),
  '/flood/policies': feature('DDoS Policies', 'Flood Shield', 'Protection profiles, thresholds, challenge modes, and emergency bypass.', 'Create policy', ['Policy', 'Layer', 'Threshold', 'Action', 'Status']),
  '/flood/incidents': feature('Incidents', 'Flood Shield', 'Incident timeline, impacted hostnames, mitigated packets, and RCA notes.', 'Create RCA', ['Incident', 'Started', 'Vector', 'Impact', 'Status']),
  '/media/live': feature('Live Streaming', 'Media Acceleration', 'Live ingest, packaging, origin failover, DVR, and viewer analytics.', 'Create channel', ['Channel', 'Input', 'Viewers', 'Latency', 'Status']),
  '/media/vod': feature('VOD', 'Media Acceleration', 'Video-on-demand acceleration, token auth, hotlink protection, and cache warming.', 'Add library', ['Library', 'Objects', 'Bandwidth', 'Hit Ratio', 'Status']),
  '/media/transcoding': feature('Transcoding', 'Media Acceleration', 'Adaptive bitrate ladders, job queue, thumbnails, and packaging outputs.', 'Create job', ['Job', 'Input', 'Profile', 'Progress', 'Status']),
  '/edge/functions': feature('Edge Functions', 'Edge Computing', 'Deploy JavaScript/Lua functions to edge PoPs with versioned rollouts.', 'Deploy function', ['Function', 'Runtime', 'Version', 'Regions', 'Status']),
  '/edge/containers': feature('Edge Containers', 'Edge Computing', 'Run lightweight containers near users with regional placement policies.', 'Create service', ['Service', 'Image', 'Replicas', 'Regions', 'Status']),
  '/edge/iot': feature('IoT Acceleration', 'Edge Computing', 'MQTT/WebSocket acceleration, device auth, and regional message routing.', 'Create endpoint', ['Endpoint', 'Protocol', 'Devices', 'Messages', 'Status']),
  '/dns/zones': feature('DNS Zones', 'Cloud DNS', 'Authoritative zones, DNSSEC, zone import/export, and delegated nameservers.', 'Create zone', ['Zone', 'Records', 'DNSSEC', 'Nameservers', 'Status']),
  '/dns/records': feature('DNS Records', 'Cloud DNS', 'Manage A, AAAA, CNAME, MX, TXT, SRV, ALIAS, and weighted records.', 'Add record', ['Name', 'Type', 'Value', 'TTL', 'Status']),
  '/dns/health-checks': feature('Health Checks', 'Cloud DNS', 'HTTP/TCP checks used by DNS failover and load balancing policies.', 'Create check', ['Check', 'Target', 'Interval', 'Last Result', 'Status']),
  '/settings/team': feature('Team & Roles', 'Admin', 'Users, roles, SSO groups, MFA, and least-privilege access policies.', 'Invite user', ['User', 'Role', 'MFA', 'Last Login', 'Status']),
  '/settings/billing': feature('Billing & Usage', 'Admin', 'Usage summary, invoices, bandwidth commits, and alert thresholds.', 'Download invoice', ['Month', 'Bandwidth', 'Requests', 'Commit', 'Status']),
};

const toneColor = { green: '#10b981', blue: '#0a4cff', orange: '#f97316', red: '#ef4444' };

function feature(title: string, product: string, description: string, primaryAction: string, columns: string[]): FeatureDef {
  return {
    title,
    product,
    description,
    primaryAction,
    stats: [
      { label: 'Active items', value: '128', tone: 'blue' },
      { label: 'Healthy', value: '99.98%', tone: 'green' },
      { label: 'Pending changes', value: '7', tone: 'orange' },
      { label: 'Errors', value: '0', tone: 'green' },
    ],
    columns,
    rows: Array.from({ length: 6 }, (_, index) => Object.fromEntries(columns.map((column, columnIndex) => [
      column,
      sampleValue(column, index, columnIndex),
    ]))),
  };
}

function sampleValue(column: string, row: number, columnIndex: number) {
  const status = row % 5 === 0 ? 'Deploying' : row % 4 === 0 ? 'Warning' : 'Active';
  if (/status|health|result|renew|mfa/i.test(column)) return status;
  if (/progress/i.test(column)) return `${72 + row * 4}%`;
  if (/requests|records|objects|viewers|devices|messages|origins|regions|attempts|blocked|allowed|challenge/i.test(column)) return (1200 + row * 137 + columnIndex * 41).toLocaleString();
  if (/bandwidth|peak/i.test(column)) return `${(0.8 + row * 0.37).toFixed(2)} TB`;
  if (/latency/i.test(column)) return `${24 + row * 7} ms`;
  if (/time|updated|used|expiry|month|started|next/i.test(column)) return row === 0 ? 'Just now' : `${row + 1}h ago`;
  if (/ttl/i.test(column)) return row % 2 ? '300s' : 'Auto';
  if (/action/i.test(column)) return row % 2 ? 'CHALLENGE' : 'BLOCK';
  if (/type|method|mode|protocol|runtime|layer/i.test(column)) return ['HTTP', 'Weighted', 'TLS', 'JavaScript', 'L7'][row % 5];
  if (/host|zone|endpoint|resource|origin|target|value|input|image/i.test(column)) return ['www.vnso.vn', 'api.vnso.vn', 'static.vnso.vn', 'media.vnso.vn', 'edge.vnso.vn'][row % 5];
  return `${column} ${row + 1}`;
}

export default function FeaturePage() {
  const { pathname } = useLocation();
  const def = useMemo(() => featureMap[pathname] || feature('Workspace', 'CDNetworks Platform', 'This module is ready for configuration.', 'Create item', ['Name', 'Type', 'Updated', 'Owner', 'Status']), [pathname]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Tag color="blue">{def.product}</Tag>
            <Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>{def.title}</Title>
            <Paragraph type="secondary" style={{ maxWidth: 760, marginBottom: 0 }}>{def.description}</Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>Refresh</Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />}>{def.primaryAction || 'Create'}</Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {def.stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.label}>
            <Card>
              <div style={{ color: '#64748b', fontSize: 12 }}>{stat.label}</div>
              <div style={{ color: toneColor[stat.tone || 'blue'], fontSize: 28, fontWeight: 700, marginTop: 6 }}>{stat.value}</div>
              <Progress percent={stat.tone === 'orange' ? 54 : 88} showInfo={false} size="small" strokeColor={toneColor[stat.tone || 'blue']} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Configuration inventory" extra={<CloudSyncOutlined />}>
            {def.rows.length ? (
              <Table
                size="small"
                rowKey={(_, index) => String(index)}
                dataSource={def.rows}
                pagination={{ pageSize: 6, size: 'small' }}
                columns={def.columns.map((column) => ({
                  title: column,
                  dataIndex: column,
                  render: (value: string | number) => /status|health|result|renew|mfa/i.test(column)
                    ? <Tag color={String(value) === 'Active' ? 'green' : String(value) === 'Warning' ? 'orange' : 'blue'}>{value}</Tag>
                    : value,
                }))}
              />
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Module summary">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Route">{pathname}</Descriptions.Item>
              <Descriptions.Item label="Owner">Platform Operations</Descriptions.Item>
              <Descriptions.Item label="Deployment">Production</Descriptions.Item>
              <Descriptions.Item label="Last sync">30 seconds ago</Descriptions.Item>
            </Descriptions>
            <Button block icon={<SettingOutlined />} style={{ marginTop: 16 }}>Open advanced settings</Button>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
