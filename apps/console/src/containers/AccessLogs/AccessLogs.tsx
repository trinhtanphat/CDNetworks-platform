import { useEffect, useMemo, useState } from 'react';
import {
  Card, Form, Select, DatePicker, Button, Table, Space, Tag, message, Tooltip,
} from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/services/api';
import { buildDateRangeQuery } from '@/utils/dateRange';

const { RangePicker } = DatePicker;

type LogRow = {
  id: string;
  hostname: string;
  date: string;       // YYYY-MM-DD
  size: number;       // bytes
  format: 'gzip' | 'plain';
  status: 'ready' | 'processing' | 'failed';
  url?: string;
};

const TIMEZONES = [
  { label: '(UTC+07:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Ho_Chi_Minh' },
  { label: '(UTC+00:00) UTC', value: 'UTC' },
  { label: '(UTC+08:00) Singapore', value: 'Asia/Singapore' },
  { label: '(UTC+09:00) Tokyo', value: 'Asia/Tokyo' },
  { label: '(UTC-08:00) Pacific Time', value: 'America/Los_Angeles' },
];

/**
 * AccessLogs — màn hình Access Logs Download.
 * Layout 2 phần: panel filter (Hostname + Date Range + Timezone) và Data Table.
 */
export default function AccessLogs() {
  const [form] = Form.useForm();
  const [hostnames, setHostnames] = useState<{ label: string; value: string }[]>([]);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Load danh sách hostname (từ API hoặc mock)
  useEffect(() => {
    api.get<{ items: string[] }>('/api/v1/hostnames')
      .then((r) => setHostnames(r.data.items.map((h) => ({ label: h, value: h }))))
      .catch(() => setHostnames([
        { label: 'www.example.com', value: 'www.example.com' },
        { label: 'static.example.com', value: 'static.example.com' },
        { label: 'api.example.com', value: 'api.example.com' },
      ]));
  }, []);

  const columns = useMemo(() => [
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname' },
    { title: 'Date', dataIndex: 'date', key: 'date', sorter: (a: LogRow, b: LogRow) => a.date.localeCompare(b.date) },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`,
    },
    { title: 'Format', dataIndex: 'format', key: 'format' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: LogRow['status']) => {
        const color = s === 'ready' ? 'green' : s === 'processing' ? 'gold' : 'red';
        return <Tag color={color}>{s.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, row: LogRow) =>
        row.status === 'ready' ? (
          <Tooltip title="Tải file log">
            <Button type="link" icon={<DownloadOutlined />} href={row.url} target="_blank">
              Download
            </Button>
          </Tooltip>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
  ], []);

  async function onSearch(values: { hostname: string[]; range: [Dayjs, Dayjs]; timezone: string }) {
    if (!values.range || values.range.length !== 2) {
      message.warning('Vui lòng chọn khoảng ngày.');
      return;
    }
    setLoading(true);
    try {
      const query = buildDateRangeQuery({
        hostnames: values.hostname,
        from: values.range[0].toDate(),
        to: values.range[1].toDate(),
        timezone: values.timezone,
      });
      const r = await api.get<{ items: LogRow[] }>('/api/v1/accesslogs', { params: query });
      setRows(r.data.items);
    } catch (e) {
      message.error('Không tải được danh sách log.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Access Logs Download</h2>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            timezone: 'Asia/Ho_Chi_Minh',
            range: [dayjs().subtract(1, 'day').startOf('day'), dayjs().endOf('day')],
          }}
          onFinish={onSearch}
        >
          <Space size="large" wrap align="end">
            <Form.Item
              label="Hostname"
              name="hostname"
              rules={[{ required: true, message: 'Chọn ít nhất 1 hostname' }]}
              style={{ minWidth: 280 }}
            >
              <Select
                mode="multiple"
                placeholder="Chọn hostname"
                options={hostnames}
                allowClear
                showSearch
              />
            </Form.Item>

            <Form.Item
              label="Date Range"
              name="range"
              rules={[{ required: true, message: 'Chọn khoảng ngày' }]}
            >
              <RangePicker showTime={false} />
            </Form.Item>

            <Form.Item label="Timezone" name="timezone" style={{ minWidth: 260 }}>
              <Select options={TIMEZONES} showSearch optionFilterProp="label" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" data-testid="btn-search" icon={<ReloadOutlined />}>
                  Search
                </Button>
                <Button onClick={() => form.resetFields()}>Reset</Button>
              </Space>
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Card>
        <Table<LogRow>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns as never}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
