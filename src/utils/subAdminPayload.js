export function buildSubAdminAccountPayload(input = {}) {
  const permissions = Array.isArray(input.permissions)
    ? input.permissions
    : typeof input.permissions === 'string'
      ? input.permissions
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  return {
    username: String(input.username || '').trim(),
    password: String(input.password || '').trim(),
    branch: String(input.branch || '').trim() || null,
    department: String(input.department || '').trim() || null,
    regulation: String(input.regulation || '').trim() || null,
    university: String(input.university || '').trim() || null,
    permissions,
    status: 'active'
  };
}
