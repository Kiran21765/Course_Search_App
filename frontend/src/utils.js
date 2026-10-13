/** "example.com" becomes "https://example.com". Empty stays empty. */
export function normalizeUrl(value) {
  const v = (value || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Returns the address only if it is a real http/https link, so "javascript:..." can never be clicked. */
export function safeUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** "Acme Training Ltd" -> "AT" */
export function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?'
  );
}

/** 15000 -> "₹15,000" (Indian digit grouping) */
export function formatFees(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

/** Today as "YYYY-MM-DD" in the person's own time zone (for the date picker's minimum). */
export function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Image types the server accepts for a logo. Judged by file name too, because some systems send no type. */
export function isLogoFile(file) {
  return /^image\/(png|jpeg|webp)$/.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
}
