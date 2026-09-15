export function createApiClient({ baseUrl, getToken, timeoutMs = 10000, retries = 1 } = {}) {
  if (!baseUrl || typeof baseUrl !== 'string') throw new Error('A backend base URL is required to create the API client.');

  async function request(path, options = {}) {
    const url = new URL(path, `${baseUrl.replace(/\/+$/, '')}/`).toString();
    const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    const token = getToken ? await getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    let attempt = 0;
    while (attempt <= retries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, headers, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body, signal: controller.signal });
        const text = await response.text();
        let payload = null;
        try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
        if (response.ok) return payload;
        if (response.status >= 500 && attempt < retries) {
          attempt += 1;
          continue;
        }
        const error = new Error(`API request failed with status ${response.status}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      } catch (error) {
        if (attempt >= retries || (error.status && error.status < 500)) throw error;
        attempt += 1;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error('API request failed');
  }

  return { request };
}
