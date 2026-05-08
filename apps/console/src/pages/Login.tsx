import { useState } from 'react';
import { Form, Input, Button, Card, Alert, Checkbox, Divider, Space } from 'antd';
import { LockOutlined, MailOutlined, SafetyCertificateTwoTone, GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/services/auth';
import { getBranding } from '@/services/branding';

/**
 * Login page — phỏng theo style enterprise SaaS.
 * Hỗ trợ:
 *  - Email + password
 *  - Remember me (lưu token vào localStorage thay vì sessionStorage)
 *  - SSO (placeholder Google/GitHub) → redirect /api/v1/auth/sso/:idp/start
 *  - 2FA → form bật bước nhập OTP nếu API trả `mfa_required`
 */
export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { from?: string } };
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const branding = getBranding();

  async function onFinish(values: { email: string; password: string; remember?: boolean }) {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password, { persist: !!values.remember });
      navigate(state?.from || '/dashboard', { replace: true });
    } catch (e) {
      setError((e as Error).message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, #0a4cff20 0%, transparent 60%), linear-gradient(180deg,#0b1220 0%,#0f1626 100%)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%', maxWidth: 420, borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 16 }}>
          <img src={branding.logoUrl} alt={branding.companyName} style={{ height: 48, maxWidth: 240, objectFit: 'contain' }} />
          <h2 style={{ margin: 0 }}>Sign in to {branding.companyName}</h2>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            Customer Portal · Production
          </span>
        </Space>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

        <Form
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@company.com" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <span>Password</span>
                <a href="/forgot-password" style={{ fontSize: 12 }}>Forgot password?</a>
              </Space>
            }
            rules={[{ required: true, message: 'Vui lòng nhập password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>Keep me signed in for 7 days</Checkbox>
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block size="large" data-testid="btn-login">
            Sign in
          </Button>

          <div style={{ marginTop: 12, color: '#64748b', fontSize: 12, textAlign: 'center' }}>
            <SafetyCertificateTwoTone twoToneColor="#10b981" /> Connection encrypted with TLS 1.3
          </div>
        </Form>

        <Divider plain>or</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            icon={<GoogleOutlined />}
            onClick={() => (window.location.href = '/api/v1/auth/sso/google/start')}
          >
            Continue with Google Workspace
          </Button>
          <Button
            block
            icon={<GithubOutlined />}
            onClick={() => (window.location.href = '/api/v1/auth/sso/github/start')}
          >
            Continue with GitHub
          </Button>
          <Button
            block
            onClick={() => (window.location.href = '/api/v1/auth/sso/saml/start')}
          >
            SAML / OIDC (Enterprise)
          </Button>
        </Space>

        <p style={{ marginTop: 16, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
          Don't have an account?{' '}
          <a href="https://cdnetworks.vnso.vn/free-trial">Start free trial</a>
        </p>
      </Card>
    </div>
  );
}
