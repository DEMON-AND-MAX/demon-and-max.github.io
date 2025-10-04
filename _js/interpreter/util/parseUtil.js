/**
 * Normalize a numeric or string value into a CSS-friendly unit
 * - numbers → "Xrem"
 * - strings → unchanged
 */
export function normalizeUnit(value) {
  if (typeof value === "number") return `${value}rem`;
  return value ?? null;
}

/**
 * Utility: deep get with fallback
 */
export function get(obj, key, def = null) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : def;
}

/**
 * Utility: extract a pair or triplet from shorthand arrays + specific overrides
 */
export function extractVector(data, baseKey, axes = ["X", "Y"], defaults = [0, 0]) {
  if (!data) return Object.fromEntries(axes.map((a, i) => [`${baseKey}${a}`, normalizeUnit(defaults[i])]));  

  const base = get(data, baseKey);
  const arr = Array.isArray(base) ? base : [];
  const result = {};

  axes.forEach((axis, i) => {
    const key = `${baseKey}${axis}`;
    const specific = get(data, key);
    // Specific key overrides array
    const raw = specific != null ? specific : arr[i] ?? defaults[i];
    result[key] = normalizeUnit(raw);
  });

  return result;
}