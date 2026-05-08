import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './containers/Dashboard/Dashboard';
import Reports from './containers/Reports/Reports';
import EdgeConfig from './containers/EdgeConfig/EdgeConfig';
import AccessLogs from './containers/AccessLogs/AccessLogs';

/** Routes nội bộ — đã được bọc trong MainLayout + ProtectedRoute ở App.tsx */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Reports group */}
      <Route path="/reports" element={<Reports />} />
      <Route path="/reports/:tab" element={<Reports />} />

      {/* Edge configurations */}
      <Route path="/edge-configurations" element={<EdgeConfig />} />
      <Route path="/edge-configurations/:tab" element={<EdgeConfig />} />

      {/* Logs */}
      <Route path="/access-logs" element={<AccessLogs />} />

      {/* Catch-all */}
      <Route path="*" element={<div style={{ padding: 24 }}>404 — Trang không tồn tại</div>} />
    </Routes>
  );
}
