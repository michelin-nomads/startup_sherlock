import { getCurrentUserToken } from './firebase';

/**
 * Authenticated fetch wrapper that automatically adds JWT token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the authentication token
  const token = await getCurrentUserToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  // Merge headers with authorization
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  // Make the request with auth header
  return fetch(url, {
    ...options,
    headers,
  });
}

