import api from './api';

const TOKEN_KEY = 'cdn_access_token';

/** Đăng nhập và lưu token. `persist=true` lưu localStorage, mặc định sessionStorage. */
export async function login(
  email: string,
  password: string,
  opts: { persist?: boolean } = {},
) {
  const { data } = await api.post('/api/v1/auth/login', { email, password });
  if (!data?.accessToken) throw new Error('Server không trả accessToken');

  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  (opts.persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, data.accessToken);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.href = '/login';
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch { return null; }
}

export function isAuthenticated(): boolean {
  const t = getToken();
  if (!t) return false;
  const payload = decodeJwt<{ exp?: number }>(t);
  if (!payload?.exp) return true;
  return payload.exp * 1000 > Date.now();
}

export function currentUser(): { sub?: string; email?: string; role?: string; tenantId?: string } | null {
  const t = getToken();
  if (!t) return null;
  return decodeJwt(t);
}
