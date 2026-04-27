const BASE = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('tienda_token') || '';
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}