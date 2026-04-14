export const ADMIN_EMAILS = [
  'abdullah@nexum.com',
  'waleed@nexum.com',
  'shamikh@nexum.com',
];

export const ADMIN_PASSWORD = 'admin@Nexum';

// Sent as X-Admin-Secret header on all admin API calls
export const ADMIN_SECRET = 'nexum_admin_2024';

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
}
