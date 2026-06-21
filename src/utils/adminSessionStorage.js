export function persistLegacyAdminSession(session = {}) {
  const payload = session.data || {};
  const normalized = {
    type: session.type || payload.type || 'admin',
    username: session.username || payload.username || payload.data?.username || '',
    data: payload,
  };

  if (typeof localStorage !== 'undefined') {
    const serialized = JSON.stringify(normalized);
    localStorage.setItem('edusync_admin_session', serialized);
    localStorage.setItem('aiiens_admin_session', serialized);
  }

  return normalized;
}
