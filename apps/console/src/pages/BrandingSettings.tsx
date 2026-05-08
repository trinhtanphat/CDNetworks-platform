import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, ColorPicker, Form, Image, Input, Row, Space, Typography, Upload } from 'antd';
import { ReloadOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { BrandingConfig, DEFAULT_BRANDING, fileToDataUrl, getBranding, resetBranding, saveBranding } from '@/services/branding';

const { Title, Paragraph } = Typography;

export default function BrandingSettings() {
  const [form] = Form.useForm<BrandingConfig>();
  const [preview, setPreview] = useState<BrandingConfig>(getBranding());

  useEffect(() => {
    form.setFieldsValue(preview);
  }, [form, preview]);

  async function setImage(field: keyof Pick<BrandingConfig, 'logoUrl' | 'socialLogoUrl' | 'faviconUrl'>, file: File) {
    const value = await fileToDataUrl(file);
    const next = { ...preview, [field]: value };
    setPreview(next);
    form.setFieldsValue({ [field]: value } as Partial<BrandingConfig>);
  }

  function onFinish(values: BrandingConfig) {
    const next = { ...preview, ...values };
    saveBranding(next);
    setPreview(next);
  }

  function onReset() {
    resetBranding();
    setPreview(DEFAULT_BRANDING);
    form.setFieldsValue(DEFAULT_BRANDING);
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>Branding</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Cập nhật logo, favicon, màu chính và tên portal. Bản prototype lưu cấu hình trong trình duyệt admin; backend branding API sẽ dùng cùng schema này.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Brand controls">
            <Form form={form} layout="vertical" initialValues={preview} onFinish={onFinish} requiredMark={false}>
              <Form.Item name="companyName" label="Company name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="portalTitle" label="Portal title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="primaryColor" label="Primary color">
                    <ColorPicker showText onChangeComplete={(color) => form.setFieldValue('primaryColor', color.toHexString())} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="accentColor" label="Accent color">
                    <ColorPicker showText onChangeComplete={(color) => form.setFieldValue('accentColor', color.toHexString())} />
                  </Form.Item>
                </Col>
              </Row>

              <Space wrap size="large" style={{ marginBottom: 16 }}>
                <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { void setImage('logoUrl', file); return false; }}>
                  <Button icon={<UploadOutlined />}>Upload logo</Button>
                </Upload>
                <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { void setImage('socialLogoUrl', file); return false; }}>
                  <Button icon={<UploadOutlined />}>Upload social logo</Button>
                </Upload>
                <Upload accept="image/png,image/x-icon,image/svg+xml" showUploadList={false} beforeUpload={(file) => { void setImage('faviconUrl', file); return false; }}>
                  <Button icon={<UploadOutlined />}>Upload favicon</Button>
                </Upload>
              </Space>

              <Form.Item name="logoUrl" hidden><Input /></Form.Item>
              <Form.Item name="socialLogoUrl" hidden><Input /></Form.Item>
              <Form.Item name="faviconUrl" hidden><Input /></Form.Item>

              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save branding</Button>
                <Button icon={<ReloadOutlined />} onClick={onReset}>Reset to official brand</Button>
              </Space>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Live preview">
            <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Official assets" description="Mặc định lấy từ /root/CDNetworks-platform/brand: logo.png, logo-social-2024.png và favicon-32x32.png." />
            <div style={{ border: '1px solid #eef0f5', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: preview.primaryColor, color: '#fff' }}>
                <img src={preview.logoUrl} alt="logo" style={{ maxHeight: 36, maxWidth: 180, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 4 }} />
                <strong>{preview.portalTitle}</strong>
              </div>
              <div style={{ padding: 16 }}>
                <Space direction="vertical">
                  <span>Favicon</span>
                  <Image src={preview.faviconUrl} width={32} height={32} preview={false} />
                  <span>Social logo</span>
                  <Image src={preview.socialLogoUrl} width={220} preview={false} />
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
