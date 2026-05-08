import { Layout, Avatar, Dropdown, Space, Badge, Input, Select, Tag } from 'antd';
import {
  BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined,
  SearchOutlined, GlobalOutlined, QuestionCircleOutlined, ApiOutlined,
} from '@ant-design/icons';
import { logout } from '@/services/auth';
import { useState } from 'react';

const { Header } = Layout;

/**
 * Topbar phỏng theo console.cdnetworks.com:
 *  - Branding + Environment switcher (Production/Staging)
 *  - Global search
 *  - Help · API Docs · Notifications · Language · Account dropdown
 */
export default function Topbar() {
  const [env, setEnv] = useState<'production' | 'staging'>('production');

  const userEmail = (() => {
    try {
      const raw = (localStorage.getItem('cdn_access_token') || '').split('.')[1];
      if (!raw) return 'admin@demo.com';
      return JSON.parse(atob(raw))?.email || 'admin@demo.com';
    } catch { return 'admin@demo.com'; }
  })();

  return (
    <Header
      style={{
        background: '#fff', padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #eef0f5', position: 'sticky', top: 0, zIndex: 10,
      }}
    >
      <Space size="large">
        <span style={{ fontSize: 16, fontWeight: 600 }}>Customer Portal</span>
        <Tag color={env === 'production' ? 'green' : 'orange'} style={{ marginInlineEnd: 0 }}>
          {env.toUpperCase()}
        </Tag>
        <Select
          size="small"
          value={env}
          onChange={(v) => setEnv(v)}
          options={[
            { label: 'Production', value: 'production' },
            { label: 'Staging',    value: 'staging' },
          ]}
          style={{ width: 130 }}
        />
      </Space>

      <Space size="large" align="center">
        <Input
          placeholder="Search domain, rule, log…"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          allowClear
        />

        <Dropdown
          menu={{
            items: [
              { key: 'docs', label: <a href="https://docs.cdnetworks-platform.local" target="_blank" rel="noreferrer">Documentation</a> },
              { key: 'api',  label: <a href="https://docs.cdnetworks-platform.local/api-reference" target="_blank" rel="noreferrer">API Reference</a> },
              { key: 'sup',  label: 'Open Support Ticket' },
            ],
          }}
        >
          <QuestionCircleOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
        </Dropdown>

        <ApiOutlined style={{ fontSize: 18, cursor: 'pointer' }} />

        <Badge count={3} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
        </Badge>

        <Dropdown
          menu={{
            items: [
              { key: 'en', label: 'English' },
              { key: 'vi', label: 'Tiếng Việt' },
              { key: 'zh', label: '中文' },
              { key: 'ja', label: '日本語' },
            ],
          }}
        >
          <Space style={{ cursor: 'pointer' }}>
            <GlobalOutlined />
            <span>EN</span>
          </Space>
        </Dropdown>

        <Dropdown
          menu={{
            items: [
              { key: 'profile', icon: <UserOutlined />,    label: 'My Profile' },
              { key: 'team',    icon: <SettingOutlined />, label: 'Team & API Keys' },
              { type: 'divider' as const },
              { key: 'logout',  icon: <LogoutOutlined />,  label: 'Sign out', onClick: () => logout() },
            ],
          }}
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" style={{ backgroundColor: '#0a4cff' }} icon={<UserOutlined />} />
            <span>{userEmail}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
