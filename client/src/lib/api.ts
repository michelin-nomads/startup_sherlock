import { getCurrentUserToken } from './firebase';

/**
 * Authenticated fetch wrapper that automatically adds JWT token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the authentication token
  console.log('🔐 Getting authentication token...');
  const token = await getCurrentUserToken();
  
  console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NULL');
  
  if (!token) {
    console.error('❌ No authentication token available!');
    throw new Error('Authentication required. Please sign in.');
  }

  // Merge headers with authorization
  // Convert headers to plain object for better compatibility
  const existingHeaders = options.headers instanceof Headers 
    ? Object.fromEntries(options.headers.entries())
    : (options.headers || {});
  
  const headers = {
    ...existingHeaders,
    'Authorization': `Bearer ${token}`
  };

  console.log('📤 Making authenticated request to:', url);
  console.log('📋 Headers:', headers);

  // Make the request with auth header
  return fetch(url, {
    ...options,
    headers,
  });
}

