/**
 * analyticsApi.js
 * API client for all /api/analytics/ endpoints.
 * Mirrors the same auth + token-refresh pattern as marketplaceApi.js.
 */

import config from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (config.BACKEND_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 15000;

async function _fetch(path, { method = 'GET', body, idToken, sessionId } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = { 'Content-Type': 'application/json' };
  if (idToken)   headers['Authorization'] = `Bearer ${idToken}`;
  if (sessionId) headers['X-Session-ID']  = sessionId;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(
      err?.name === 'AbortError'
        ? 'Request timed out. Check backend URL and server status.'
        : 'Network error. Check backend URL and internet/LAN connectivity.'
    );
  }

  clearTimeout(timeout);

  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Request failed.';
    const error = new Error(message);
    error.status  = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function _fetchWithRefresh(path, options = {}) {
  try {
    return await _fetch(path, options);
  } catch (err) {
    const isAuthError = err.status === 401 || err.status === 403;
    const canRefresh  = isAuthError && options.refreshToken && options.onTokenRefreshed;
    if (!canRefresh) throw err;

    let newIdToken;
    try {
      const refreshed = await _fetch('/api/users/auth/token-refresh/', {
        method: 'POST',
        body: { refresh_token: options.refreshToken },
      });
      newIdToken = refreshed.id_token;
      await AsyncStorage.setItem('id_token', newIdToken);
      if (refreshed.refresh_token)
        await AsyncStorage.setItem('refresh_token', refreshed.refresh_token);
      options.onTokenRefreshed(newIdToken, refreshed.refresh_token);
    } catch {
      throw err;
    }

    return await _fetch(path, { ...options, idToken: newIdToken });
  }
}

// ── Market Analysis (all users) ───────────────────────────────────────────────

export function getMarketCurrent({ city = '', idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : '';
  return _fetchWithRefresh(`/api/analytics/market/current/${qs}`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

export function getMarketHistory({ city = '', category = '', idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  const p = new URLSearchParams();
  if (city)     p.set('city', city);
  if (category) p.set('category', category);
  const qs = p.toString();
  return _fetchWithRefresh(`/api/analytics/market/history/${qs ? `?${qs}` : ''}`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

export function getMarketForecast({ city = '', idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : '';
  return _fetchWithRefresh(`/api/analytics/market/forecast/${qs}`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

export function getMarketTopProducts({ city = '', idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : '';
  return _fetchWithRefresh(`/api/analytics/market/top-products/${qs}`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ── Personal Analysis ─────────────────────────────────────────────────────────

export function getSupplierAnalysis({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/analytics/supplier/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

export function getShopkeeperRecommendations({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/analytics/shopkeeper/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}
