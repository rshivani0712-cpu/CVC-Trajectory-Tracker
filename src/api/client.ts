/**
 * API Client configured for external FastAPI backend integration.
 * Supports configurable VITE_API_BASE_URL.
 * Falls back to clean local simulated responses when backend is unavailable.
 */

/**
 * Centralized API Client configured for external FastAPI backend integration.
 * Defaults to http://127.0.0.1:8000, configurable via VITE_API_BASE_URL.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export function getAuthToken(): string | null {
  return localStorage.getItem('cvc_auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('cvc_auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('cvc_auth_token');
  localStorage.removeItem('cvc_current_user');
}

export async function checkHealth(): Promise<{ status: string; [key: string]: any }> {
  try {
    return await apiRequest<{ status: string; [key: string]: any }>('/api/health', {
      method: 'GET',
    });
  } catch (err) {
    console.warn('[CVC API] Backend health check failed:', err);
    throw err;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errJson = await response.json();
        errorMessage = errJson.detail || errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(`API error (${response.status}): ${errorMessage}`);
    }

    // Handle empty responses (like 204 No Content)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (err: any) {
    console.warn(`[CVC API] Remote call to ${endpoint} failed:`, err);
    throw err;
  }
}
