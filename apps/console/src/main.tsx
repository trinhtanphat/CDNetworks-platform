import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { applyBranding, getBranding } from './services/branding';
import { antdTheme } from './styles/theme';
import 'antd/dist/reset.css';
import './styles.css';
import './styles/cdn-layout.css';

applyBranding(getBranding());

const branding = getBranding();
const themeConfig = {
  ...antdTheme,
  token: {
    ...antdTheme.token,
    // Override primary nếu admin đổi qua Branding settings
    colorPrimary: branding.primaryColor || antdTheme.token.colorPrimary,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
