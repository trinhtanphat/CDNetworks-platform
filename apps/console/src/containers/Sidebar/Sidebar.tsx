import { Layout, Menu, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  FileSearchOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  GlobalOutlined,
  RocketOutlined,
  DatabaseOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const { Sider } = Layout;

/**
 * Sidebar phong cách console.cdnetworks.com.
 * 2 cấp:
 *  - Cấp 1 (rail trái 64px): chuyển product (CDN Pro, Application Shield, Flood Shield...).
 *  - Cấp 2 (240px): menu chi tiết của product đang chọn.
 *
 * Class `isomorphicSidebar`, `isoDashboardMenu` được giữ để theme template gốc còn áp dụng.
 */

type ProductKey = 'cdn-pro' | 'application-shield' | 'flood-shield' | 'media' | 'edge' | 'dns';

type ProductDef = {
  key: ProductKey;
  label: string;
  icon: React.ReactNode;
  menu: { key: string; label: string; icon?: React.ReactNode; children?: { key: string; label: string }[] }[];
};

const PRODUCTS: ProductDef[] = [
  {
    key: 'cdn-pro',
    label: 'CDN Pro',
    icon: <RocketOutlined />,
    menu: [
      { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
      {
        key: 'reports',
        label: 'Reports',
        icon: <BarChartOutlined />,
        children: [
          { key: '/reports/traffic', label: 'Traffic' },
          { key: '/reports/visitor', label: 'Visitor' },
          { key: '/reports/resource', label: 'Resource' },
          { key: '/reports/probe', label: 'Probe' },
        ],
      },
      {
        key: 'edge-config',
        label: 'Edge Configurations',
        icon: <CloudServerOutlined />,
        children: [
          { key: '/edge-configurations/properties', label: 'Properties' },
          { key: '/edge-configurations/cache-rules', label: 'Cache Rules' },
          { key: '/edge-configurations/origin', label: 'Origin Settings' },
          { key: '/edge-configurations/headers', label: 'Custom Headers' },
        ],
      },
      {
        key: 'traffic',
        label: 'Traffic Management',
        icon: <ApartmentOutlined />,
        children: [
          { key: '/traffic/dns', label: 'DNS' },
          { key: '/traffic/loadbalancer', label: 'Load Balancer' },
          { key: '/traffic/geo', label: 'Geo Routing' },
        ],
      },
      {
        key: 'logs',
        label: 'Logs',
        icon: <FileSearchOutlined />,
        children: [
          { key: '/access-logs', label: 'Access Logs' },
          { key: '/origin-logs', label: 'Origin Logs' },
          { key: '/audit-logs', label: 'Audit Logs' },
        ],
      },
      {
        key: 'ssl',
        label: 'SSL / TLS',
        icon: <SafetyCertificateOutlined />,
        children: [
          { key: '/ssl/certificates', label: 'Certificates' },
          { key: '/ssl/auto-renew', label: 'Auto Renew' },
        ],
      },
      { key: '/api-keys', label: 'API Keys', icon: <KeyOutlined /> },
      { key: '/tools/purge', label: 'Purge & Prefetch', icon: <ToolOutlined /> },
    ],
  },
  {
    key: 'application-shield',
    label: 'Application Shield',
    icon: <SafetyCertificateOutlined />,
    menu: [
      { key: '/shield/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
      { key: '/shield/waf-rules', label: 'WAF Rules' },
      { key: '/shield/bot-management', label: 'Bot Management' },
      { key: '/shield/api-protection', label: 'API Protection' },
      { key: '/shield/events', label: 'Security Events' },
    ],
  },
  {
    key: 'flood-shield',
    label: 'Flood Shield',
    icon: <ApartmentOutlined />,
    menu: [
      { key: '/flood/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
      { key: '/flood/policies', label: 'DDoS Policies' },
      { key: '/flood/incidents', label: 'Incidents' },
    ],
  },
  {
    key: 'media',
    label: 'Media Acceleration',
    icon: <DatabaseOutlined />,
    menu: [
      { key: '/media/live', label: 'Live Streaming' },
      { key: '/media/vod', label: 'VOD' },
      { key: '/media/transcoding', label: 'Transcoding' },
    ],
  },
  {
    key: 'edge',
    label: 'Edge Computing',
    icon: <AppstoreOutlined />,
    menu: [
      { key: '/edge/functions', label: 'Edge Functions' },
      { key: '/edge/containers', label: 'Edge Containers' },
      { key: '/edge/iot', label: 'IoT Acceleration' },
    ],
  },
  {
    key: 'dns',
    label: 'Cloud DNS',
    icon: <GlobalOutlined />,
    menu: [
      { key: '/dns/zones', label: 'Zones' },
      { key: '/dns/records', label: 'Records' },
      { key: '/dns/health-checks', label: 'Health Checks' },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [productKey, setProductKey] = useState<ProductKey>('cdn-pro');
  const product = PRODUCTS.find((p) => p.key === productKey)!;

  const items = product.menu.map((m) => {
    if (m.children) return { key: m.key, icon: m.icon, label: m.label, children: m.children };
    return { key: m.key, icon: m.icon, label: m.label };
  });
  const openKeys = product.menu
    .filter((m) => m.children?.some((c) => c.key === pathname))
    .map((m) => m.key);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Cấp 1: product rail */}
      <div
        className="cdnProductRail"
        style={{
          width: 64,
          background: '#0b1220',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          gap: 4,
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(120deg,#0a4cff,#00c8b8)',
            color: '#fff', display: 'grid', placeItems: 'center',
            fontWeight: 800, marginBottom: 8,
          }}
          aria-label="CDNetworks"
        >
          C
        </div>
        {PRODUCTS.map((p) => (
          <Tooltip key={p.key} title={p.label} placement="right">
            <button
              onClick={() => setProductKey(p.key)}
              style={{
                width: 44, height: 44, marginTop: 4,
                background: productKey === p.key ? 'rgba(10,76,255,0.25)' : 'transparent',
                color: productKey === p.key ? '#5a8bff' : '#7a8aa6',
                border: 0, borderRadius: 8, cursor: 'pointer',
                fontSize: 18, display: 'grid', placeItems: 'center',
                transition: 'all .15s',
              }}
              aria-label={p.label}
            >
              {p.icon}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Cấp 2: menu chi tiết */}
      <Sider
        width={240}
        className="isomorphicSidebar"
        style={{ background: '#0f1626' }}
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div
          style={{
            height: 64, padding: '0 20px',
            display: 'flex', alignItems: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {product.label}
        </div>
        <Menu
          className="isoDashboardMenu"
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={openKeys}
          items={items as never}
          onClick={({ key }) => key.startsWith('/') && navigate(key)}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
    </div>
  );
}
