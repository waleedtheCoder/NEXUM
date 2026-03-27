import config from '../../config';

const BASE_URL = (config.BACKEND_URL || '').replace(/\/$/, '');

function normalizeRoleForApi(role) {
  if (!role) return '1';
  const value = String(role).trim().toLowerCase();
  if (value === '1' || value === 'shopkeeper') return '1';
  if (value === '2' || value === 'supplier') return '2';
  return '1';
}

function normalizeRoleFromApi(role) {
  const value = String(role || '').trim().toUpperCase();
  if (value === 'SUPPLIER') return 'supplier';
  if (value === 'SHOPKEEPER') return 'shopkeeper';
  if (value === 'CUSTOMER') return 'shopkeeper';
  return 'shopkeeper';
}

async function request(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const message = err?.name === 'AbortError'
      ? 'Request timed out. Check backend URL and server status.'
      : 'Network error. Check backend URL and internet/LAN connectivity.';
    throw new Error(message);
  }

  clearTimeout(timeout);

  let payload = {};
  try {
    payload = await response.json();
  } catch (err) {
    payload = {};
  }

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Request failed.';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function loginWithBackend({ email, password, role }) {
  return request('/api/users/auth/login/', {
    email,
    password,
    role: normalizeRoleForApi(role),
  });
}

export async function signupWithBackend({ name, email, password, role }) {
  return request('/api/users/auth/signup/', {
    name,
    email,
    password,
    role: normalizeRoleForApi(role),
  });
}

export async function verifyOtpWithBackend({ email, otp, flow }) {
  return request('/api/users/auth/verify-otp/', { email, otp, flow });
}

export async function forgotPasswordWithBackend({ email }) {
  return request('/api/users/auth/forgot-password/', { email });
}

export async function resetPasswordWithBackend({ email, otp, newPassword }) {
  return request('/api/users/auth/reset-password/', {
    email,
    otp,
    new_password: newPassword,
  });
}

export { normalizeRoleFromApi };
