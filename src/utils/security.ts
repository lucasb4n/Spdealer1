/**
 * Security Utilities — SPDealer
 * CSRF Protection + Input Sanitization
 */

// ============================================================
// CSRF TOKEN MANAGEMENT
// ============================================================

const CSRF_TOKEN_KEY = 'sp_csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getCsrfToken(): string {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCsrfToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  return token;
}

export function refreshCsrfToken(): string {
  const token = generateCsrfToken();
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

export function getCsrfHeaders(): Record<string, string> {
  return { [CSRF_HEADER_NAME]: getCsrfToken() };
}

// ============================================================
// INPUT SANITIZATION
// ============================================================

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"'`/]/g, char => HTML_ESCAPE_MAP[char] || char);
}

export function stripHtmlTags(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return stripHtmlTags(input).trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj } as any;
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  }
  return sanitized;
}

// ============================================================
// COOKIE SECURITY HELPER
// ============================================================

export function setSecureCookie(name: string, value: string, days: number = 1): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict;Secure`;
}

// ============================================================
// SESSION TIMEOUT (UI-side warning)
// ============================================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Warn 5 min before

let sessionTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;

export function resetSessionTimer(
  onWarning?: () => void,
  onTimeout?: () => void
): void {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (warningTimer) clearTimeout(warningTimer);

  if (onWarning) {
    warningTimer = setTimeout(onWarning, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
  }
  if (onTimeout) {
    sessionTimer = setTimeout(onTimeout, SESSION_TIMEOUT_MS);
  }
}

export function clearSessionTimers(): void {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (warningTimer) clearTimeout(warningTimer);
  sessionTimer = null;
  warningTimer = null;
}













