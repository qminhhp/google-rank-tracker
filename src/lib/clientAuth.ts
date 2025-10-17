// Client-side helper để làm việc với Google OAuth credentials

export function getStoredCredentials() {
  if (typeof window === 'undefined') {
    return { clientId: null, clientSecret: null };
  }

  const clientId = localStorage.getItem('google_client_id');
  const clientSecret = localStorage.getItem('google_client_secret');

  return { clientId, clientSecret };
}

export function setStoredCredentials(clientId: string, clientSecret: string) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('google_client_id', clientId);
  localStorage.setItem('google_client_secret', clientSecret);
}

export function clearStoredCredentials() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('google_client_id');
  localStorage.removeItem('google_client_secret');
}

export function addCredentialsToHeaders(headers: Record<string, string> = {}) {
  const { clientId, clientSecret } = getStoredCredentials();

  if (clientId && clientSecret) {
    headers['x-google-client-id'] = clientId;
    headers['x-google-client-secret'] = clientSecret;
  }

  return headers;
}

export async function fetchWithCredentials(url: string, options: RequestInit = {}) {
  const headers = addCredentialsToHeaders(
    options.headers as Record<string, string> || {}
  );

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
