import { Layout } from 'antd';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';

const { Content } = Layout;

/**
 * MainLayout — khung chính của Console.
 * Class `ant-layout`, `isomorphicSidebar`, `isoDashboardMenu` được giữ
 * để tương thích style đến từ template Isomorphic.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout className="ant-layout isomorphicLayout cdn-app-shell" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Topbar />
        <Content
          className="isoContent cdn-content"
          style={{
            margin: 0,
            padding: 20,
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
