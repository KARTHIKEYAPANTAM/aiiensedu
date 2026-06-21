// Formatters utility functions
export function formatDate(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString();
  } catch {
    return isoString;
  }
}
