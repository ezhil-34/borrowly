/**
 * HTTP Client Wrapper with JWT Authentication Injection & Error Handling
 */

const TOKEN_KEY = 'bt';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function buildQueryString(params = {}) {
  const entries = Object.entries(params).filter(
    ([, val]) => val !== '' && val !== null && val !== undefined
  );
  if (!entries.length) return '';
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export async function request(path, options = {}) {
  const token = getStoredToken();
  const hasBody = options.body !== undefined;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch('/api' + path, {
    method: options.method || (hasBody ? 'POST' : 'GET'),
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
