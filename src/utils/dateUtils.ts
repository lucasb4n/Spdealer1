/**
 * dateUtils.ts
 * Helpers para parsing de datas no formato YYYY-MM-DD como datas locais
 * Evita problemas de timezone causados por `new Date('YYYY-MM-DD')` que é tratado como UTC.
 */

export function isYMDString(s: any): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Parseia uma string `YYYY-MM-DD` como Date local (sem deslocamento UTC).
 * Se receber um Date, retorna o próprio Date.
 * Se não reconhecer, tenta `new Date(value)` como fallback e retorna null se inválido.
 */
export function parseDateLocal(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (isYMDString(value)) {
    const [y, m, d] = value.split('-').map((x) => parseInt(x, 10));
    // monthIndex: 0-based
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  // fallback: let JS try (may parse with timezone). Keep safe.
  try {
    const dt = new Date(value as string);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
}

export function formatYMDLocal(dateLike: Date | string | null | undefined): string {
  const dt = parseDateLocal(dateLike as any);
  if (!dt) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const dateUtils = {
  isYMDString,
  parseDateLocal,
  formatYMDLocal,
};

export default dateUtils;













