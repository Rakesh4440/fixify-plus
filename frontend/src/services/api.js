const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  // Add auth header if present
  if (token) headers.Authorization = `Bearer ${token}`;

  // If body is FormData, DO NOT set Content-Type or stringify
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: payload
  });

  // Try to parse JSON; fall back if empty
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* no body */
  }

  if (!res.ok) {
    throw new Error((data && data.message) || 'API error');
  }
  return data;
}
