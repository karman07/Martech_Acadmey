/**
 * Accepts either a JSON array (fetch with a JSON body) or a comma-separated
 * string (multipart form fields are always strings) and normalizes both to
 * a clean string array.
 */
export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}
