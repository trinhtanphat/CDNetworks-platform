import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/services/auth';

/**
 * ProtectedRoute — bọc quanh các route cần auth.
 * - Chưa đăng nhập → redirect /login, lưu vị trí để quay lại sau khi login.
 * - Token hết hạn (decode JWT exp) → cũng coi như chưa auth.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
