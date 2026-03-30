/**
 * marketplaceApi.js
 *
 * Central API client for all marketplace, chat, and notifications endpoints.
 * Mirrors the pattern of authApi.js:
 *   - 15-second AbortController timeout on every request
 *   - Automatic 401/403 token-refresh + one-retry via the token-refresh endpoint
 *   - Errors are enriched with .status and .payload for fine-grained handling
 */

import config from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (config.BACKEND_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 15000;

// ─── Low-level fetch wrapper ──────────────────────────────────────────────────

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
    const message =
      err?.name === 'AbortError'
        ? 'Request timed out. Check backend URL and server status.'
        : 'Network error. Check backend URL and internet/LAN connectivity.';
    throw new Error(message);
  }

  clearTimeout(timeout);

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Request failed.';
    const error = new Error(message);
    error.status  = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

// ─── Multipart fetch (no Content-Type — browser sets boundary automatically) ─

async function _fetchMultipart(path, { formData, idToken, sessionId } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {};
  if (idToken)   headers['Authorization'] = `Bearer ${idToken}`;
  if (sessionId) headers['X-Session-ID']  = sessionId;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const message =
      err?.name === 'AbortError'
        ? 'Upload timed out. Check your connection.'
        : 'Network error during upload.';
    throw new Error(message);
  }

  clearTimeout(timeout);

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Upload failed.';
    const error = new Error(message);
    error.status  = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

// ─── Token-refresh + retry wrapper ───────────────────────────────────────────

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
      if (refreshed.refresh_token) {
        await AsyncStorage.setItem('refresh_token', refreshed.refresh_token);
      }

      options.onTokenRefreshed(newIdToken, refreshed.refresh_token);
    } catch {
      throw err;
    }

    return await _fetch(path, { ...options, idToken: newIdToken });
  }
}

// ─── Listings & Marketplace ───────────────────────────────────────────────────

/**
 * GET /api/listings/
 * Returns active listing cards.
 * Public.
 */
export async function getListings({ category, q, sort, featured } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (q)        params.set('q', q);
  if (sort)     params.set('sort', sort);
  if (featured) params.set('featured', 'true');
  const qs = params.toString();
  return _fetch(`/api/listings/${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/listings/<id>/
 * Returns full product detail. Public.
 */
export async function getListingDetail(id) {
  return _fetch(`/api/listings/${id}/`);
}

/**
 * GET /api/listings/categories/
 * Returns the full category tree. Public.
 */
export async function getCategories() {
  return _fetch('/api/listings/categories/');
}

/**
 * GET /api/listings/search/?q=<query>
 * Returns { results: [...listing cards] }. Public.
 */
export async function searchListings(q) {
  return _fetch(`/api/listings/search/?q=${encodeURIComponent(q)}`);
}

/**
 * GET /api/listings/my/
 * Returns the authenticated supplier's own listings. Protected.
 */
export async function getMyListings({ idToken, sessionId, refreshToken, onTokenRefreshed, status } = {}) {
  const qs = status ? `?status=${status}` : '';
  return _fetchWithRefresh(`/api/listings/my/${qs}`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/listings/create/
 * Creates a new listing. Protected.
 */
export async function createListing(data, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/listings/create/', {
    method: 'POST',
    body: data,
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * PATCH /api/listings/<id>/manage/
 * Edits an existing listing (owner only). Protected.
 */
export async function updateListing(id, data, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/listings/${id}/manage/`, {
    method: 'PATCH',
    body: data,
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * DELETE /api/listings/<id>/manage/
 * Soft-removes a listing (owner only). Protected.
 */
export async function deleteListing(id, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/listings/${id}/manage/`, {
    method: 'DELETE',
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/listings/<id>/save/   — save (heart)
 * DELETE /api/listings/<id>/save/ — unsave
 * Protected.
 */
export async function toggleSaveListing(id, shouldSave, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/listings/${id}/save/`, {
    method: shouldSave ? 'POST' : 'DELETE',
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * GET /api/listings/supplier/dashboard/
 * Returns { performance: [...], recent_inquiries: [...] }. Protected.
 */
export async function getSupplierDashboard({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/listings/supplier/dashboard/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Promotions ───────────────────────────────────────────────────────────────

/**
 * GET /api/promotions/
 * Returns active promotional banners for HomeScreen.
 * Response: [{ id, title, subtitle, imageUrl, actionUrl, badge }]
 * Public — no auth required.
 */
export async function getPromotions() {
  return _fetch('/api/promotions/');
}

/**
 * POST /api/listings/<id>/promote/
 * Creates or updates a discount promotion on a supplier's own listing.
 * Body: { discount_percent: 20 }
 * Response: { discountPercent, discountedPrice, originalPrice }
 * Protected.
 */
export async function setListingPromotion(listingId, discountPercent, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/listings/${listingId}/promote/`, {
    method: 'POST',
    body: { discount_percent: discountPercent },
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * DELETE /api/listings/<id>/promote/
 * Removes the promotion from the listing.
 * Protected.
 */
export async function removeListingPromotion(listingId, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/listings/${listingId}/promote/`, {
    method: 'DELETE',
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Trending Search ──────────────────────────────────────────────────────────

/**
 * GET /api/listings/search/trending/
 * Returns trending product titles and supplier names for SearchScreen chips.
 * Response: { popularProducts: [...], popularSuppliers: [...] }
 * Public — no auth required.
 */
export async function getTrendingSearch() {
  return _fetch('/api/listings/search/trending/');
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

/**
 * POST /api/listings/upload-image/
 * Uploads an image file and returns its public URL.
 *
 * @param {{ uri: string, name: string, type: string }} file
 *   The file object from expo-image-picker (assets[0]).
 *   uri  — local file URI (e.g. file:///...)
 *   name — filename with extension
 *   type — MIME type (e.g. 'image/jpeg')
 *
 * Response: { imageUrl: "https://..." }
 * Protected.
 */
export async function uploadListingImage(file, { idToken, sessionId } = {}) {
  const formData = new FormData();
  formData.append('image', {
    uri:  file.uri,
    name: file.name || 'photo.jpg',
    type: file.type || 'image/jpeg',
  });
  return _fetchMultipart('/api/listings/upload-image/', { formData, idToken, sessionId });
}

// ─── Saved Listings ───────────────────────────────────────────────────────────

/**
 * GET /api/listings/saved/
 * Returns all listings the current user has saved (hearted).
 * Response: [...listing card objects]
 * Protected.
 */
export async function getSavedListings({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/listings/saved/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Supplier Profile ─────────────────────────────────────────────────────────

/**
 * GET /api/users/supplier/<id>/
 * Returns a supplier's public profile plus their active listings.
 * Response: { id, name, initials, rating, totalListings, is_favourite, listings: [...] }
 * Optional auth — pass authArgs to get is_favourite populated.
 */
export async function getSupplierProfile(supplierId, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  if (idToken || sessionId) {
    return _fetchWithRefresh(`/api/users/supplier/${supplierId}/`, {
      idToken, sessionId, refreshToken, onTokenRefreshed,
    });
  }
  return _fetch(`/api/users/supplier/${supplierId}/`);
}

/**
 * GET /api/users/network/
 * Returns the authenticated shopkeeper's list of favourite suppliers.
 * Response: [ { id, name, initials, avatarColor, totalListings }, ... ]
 * Protected.
 */
export async function getSupplierNetwork({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/users/network/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/users/network/toggle/
 * Toggles a supplier in/out of the shopkeeper's favourites.
 * Body: { supplier_id: <int> }
 * Response: { is_favourite: true|false }
 * Protected.
 */
export async function toggleFavouriteSupplier(supplierId, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/users/network/toggle/', {
    method: 'POST',
    body: { supplier_id: supplierId },
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── FCM Token ────────────────────────────────────────────────────────────────

/**
 * POST /api/users/fcm-token/
 * Registers the device's Expo push token so the backend can send push notifications.
 * Body: { token: <expo_push_token> }
 * Protected.
 */
export async function registerFCMToken(token, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/users/fcm-token/', {
    method: 'POST',
    body: { fcm_token: token },
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/chat/
 * Returns conversations for the authenticated user.
 * Optional type filter: 'buying' | 'selling' | 'favourites'. Protected.
 */
export async function getConversations({ type, idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  const qs = type && type !== 'All' ? `?type=${type.toLowerCase()}` : '';
  return _fetchWithRefresh(`/api/chat/${qs}`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/chat/start/
 * Creates or retrieves a conversation about a listing.
 * Body: { listing_id, message }. Protected.
 */
export async function startConversation({ listingId, message, idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/chat/start/', {
    method: 'POST',
    body: { listing_id: listingId, message },
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * GET /api/chat/<conv_id>/messages/
 * Returns all messages in a conversation. Protected.
 */
export async function getMessages(convId, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/chat/${convId}/messages/`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/chat/<conv_id>/messages/send/
 * Sends a new message in a conversation. Protected.
 */
export async function sendMessage(convId, text, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/chat/${convId}/messages/send/`, {
    method: 'POST',
    body: { text },
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/
 * Returns notifications for the authenticated user. Protected.
 */
export async function getNotifications({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/notifications/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * PATCH /api/notifications/<id>/read/
 * Marks a single notification as read. Protected.
 */
export async function markNotificationRead(id, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/notifications/${id}/read/`, {
    method: 'PATCH',
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/notifications/mark-all-read/
 * Marks all notifications as read. Protected.
 */
export async function markAllNotificationsRead({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/notifications/mark-all-read/', {
    method: 'POST',
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * GET /api/orders/
 * Returns the shopkeeper's order history, newest first.
 * Response is paginated: { count, next, previous, results: [...orders] }
 * Protected.
 */
export async function getOrders({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/orders/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * POST /api/orders/place/
 * Shopkeeper places an order on a listing.
 * Body: { listing_id, quantity, notes? }
 * Protected.
 */
export async function placeOrder(data, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/orders/place/', {
    method: 'POST',
    body: data,
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * GET /api/orders/<id>/
 * Returns a single order's full detail. Protected.
 */
export async function getOrderDetail(orderId, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/orders/${orderId}/`, {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

// ─── Incoming Orders (supplier) ───────────────────────────────────────────────

/**
 * GET /api/orders/incoming/
 * Returns all orders placed on the supplier's listings.
 * Response: [...orders] — newest first on the backend.
 * Protected.
 */
export async function getIncomingOrders({ idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/orders/incoming/', {
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

/**
 * PATCH /api/orders/<id>/
 * Supplier updates order status.
 * @param {number} orderId
 * @param {'confirmed'|'shipped'|'delivered'|'cancelled'} newStatus
 * Protected (supplier only).
 */
export async function updateOrderStatus(orderId, newStatus, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh(`/api/orders/${orderId}/`, {
    method: 'PATCH',
    body: { status: newStatus },
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}

export async function updateProfile(data, { idToken, sessionId, refreshToken, onTokenRefreshed } = {}) {
  return _fetchWithRefresh('/api/users/profile/', {
    method: 'PATCH',
    body: data,
    idToken, sessionId, refreshToken, onTokenRefreshed,
  });
}
 