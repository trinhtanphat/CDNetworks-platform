import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './containers/Dashboard/Dashboard';
import AccessLogs from './containers/AccessLogs/AccessLogs';
import FeaturePage from './pages/FeaturePage';
import BrandingSettings from './pages/BrandingSettings';

/** Routes nội bộ — đã được bọc trong MainLayout + ProtectedRoute ở App.tsx */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/cdn/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Reports group */}
      <Route path="/reports" element={<Navigate to="/reports/traffic" replace />} />
      <Route path="/reports/:tab" element={<FeaturePage />} />

      {/* Edge configurations */}
      <Route path="/edge-configurations" element={<Navigate to="/edge-configurations/properties" replace />} />
      <Route path="/edge-configurations/:tab" element={<FeaturePage />} />

      {/* Logs */}
      <Route path="/access-logs" element={<AccessLogs />} />
      <Route path="/origin-logs" element={<FeaturePage />} />
      <Route path="/audit-logs" element={<FeaturePage />} />

      {/* CDN / Security / DNS / Edge modules */}
      <Route path="/traffic/:tab" element={<FeaturePage />} />
      <Route path="/ssl/:tab" element={<FeaturePage />} />
      <Route path="/api-keys" element={<FeaturePage />} />
      <Route path="/tools/:tab" element={<FeaturePage />} />
      <Route path="/shield/:tab" element={<FeaturePage />} />
      <Route path="/flood/:tab" element={<FeaturePage />} />
      <Route path="/media/:tab" element={<FeaturePage />} />
      <Route path="/edge/:tab" element={<FeaturePage />} />
      <Route path="/dns/:tab" element={<FeaturePage />} />

      {/* Admin */}
      <Route path="/settings/branding" element={<BrandingSettings />} />
      <Route path="/settings/team" element={<FeaturePage />} />
      <Route path="/settings/billing" element={<FeaturePage />} />

      {/* Catch-all */}
      <Route path="*" element={<div style={{ padding: 24 }}>404 — Trang không tồn tại</div>} />
    </Routes>
  );
}
