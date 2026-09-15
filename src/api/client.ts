/**
 * API Client configured for external FastAPI backend integration.
 * Supports configurable VITE_API_BASE_URL.
 * Falls back to clean local simulated responses when backend is unavailable.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('cvc_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  // If there's an actual external API URL specified, attempt network call
  if (API_BASE_URL) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      console.warn(`[CVC API] Remote call to ${endpoint} failed, utilizing local fallback engine:`, err);
      throw err;
    }
  }

  // Otherwise throw to trigger clean local mock handling
  throw new Error('BACKEND_NOT_CONFIGURED');
}
