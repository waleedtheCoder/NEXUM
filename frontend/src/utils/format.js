/**
 * Centralised formatting utilities so every screen shows prices the same way.
 */

/**
 * Formats a numeric or string price as "Rs 1,234"
 * Returns "—" if the value is null/undefined/NaN.
 */
export function formatPrice(price) {
  if (price == null || price === '') return '—';
  const n = parseFloat(price);
  if (isNaN(n)) return '—';
  return `Rs ${n.toLocaleString()}`;
}
