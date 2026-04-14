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
  if (value === 'CUSTOMER') return 'customer';
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

export async function createGuestSessionFromBackend() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/users/auth/guest-session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || 'Unable to create guest session.');
  }

  return payload;
}


export async function getAnonymousSession() {
  return request('/api/users/auth/guest-session/', {});
}

export async function rotateSessionWithBackend({ sessionId, idToken }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['X-Session-ID'] = sessionId;
  else if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/users/auth/rotate-session/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(
      err?.name === 'AbortError' ? 'Session rotation timed out.' : 'Network error during session rotation.',
    );
  }

  clearTimeout(timeout);

  let payload = {};
  try { payload = await response.json(); } catch (_) {}

  if (!response.ok) {
    const error = new Error(payload?.detail || 'Session rotation failed.');
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function logoutFromBackend(sessionId) {
  if (!sessionId) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    await fetch(`${BASE_URL}/api/users/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      signal: controller.signal,
    });
  } catch (_) {
    // Best-effort — local logout still completes even if the request fails.
  } finally {
    clearTimeout(timeout);
  }
}

export { normalizeRoleFromApi };
