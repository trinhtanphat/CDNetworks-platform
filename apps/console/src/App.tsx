import { Routes, Route } from 'react-router-dom';
import MainLayout from './containers/App/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AppRoutes from './routes';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected (mọi route khác bọc trong layout + auth guard) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AppRoutes />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
