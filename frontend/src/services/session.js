export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      token,
      id: payload.id,
      role: payload.role,
      name: payload.name,
      email: payload.email
    };
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getCurrentUser() {
  return decodeToken(getToken());
}

export function saveSession(token) {
  localStorage.setItem('token', token);
  return decodeToken(token);
}

export function clearSession() {
  localStorage.removeItem('token');
}

