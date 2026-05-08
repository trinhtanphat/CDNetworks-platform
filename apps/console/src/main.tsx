import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { applyBranding, getBranding } from './services/branding';
import 'antd/dist/reset.css';
import './styles.css';

applyBranding(getBranding());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: { colorPrimary: getBranding().primaryColor, borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif' },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
