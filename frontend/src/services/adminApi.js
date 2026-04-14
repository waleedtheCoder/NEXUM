import config from '../../config';
import { ADMIN_SECRET } from '../constants/adminConfig';

const BASE_URL = (config.BACKEND_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 15000;

async function _adminFetch(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': ADMIN_SECRET,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(
      err?.name === 'AbortError'
        ? 'Request timed out.'
        : 'Network error. Check server connectivity.',
    );
  }

  clearTimeout(timeout);

  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }

  if (!response.ok) {
    throw new Error(payload?.detail || 'Request failed.');
  }
  return payload;
}

export async function getAdminStats() {
  return _adminFetch('/api/users/admin/stats/');
}

export async function getAdminSuppliers() {
  return _adminFetch('/api/users/admin/suppliers/');
}

export async function getAdminShopkeepers() {
  return _adminFetch('/api/users/admin/shopkeepers/');
}

export async function getAdminListings() {
  return _adminFetch('/api/listings/admin/');
}

export async function getAdminVerifications() {
  return _adminFetch('/api/users/admin/verifications/');
}

export async function approveVerification(supplierId) {
  return _adminFetch(`/api/users/admin/verifications/${supplierId}/`, { method: 'POST' });
}
