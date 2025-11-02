import { getCurrentUserToken } from './firebase';

/**
 * Extract user-friendly error message from API response
 * @param response - The fetch response
 * @returns Promise<string> - User-friendly error message
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    // Try to extract message from various common error formats
    return errorData.message || errorData.error || errorData.details || 'An error occurred';
  } catch (parseError) {
    // If JSON parsing fails, use status text
    return response.statusText || `Error ${response.status}`;
  }
}

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

/**
 * Authenticated fetch with automatic JSON error parsing
 * Throws user-friendly error messages instead of raw responses
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<any> - Parsed JSON response
 */
export async function authenticatedFetchJSON(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await authenticatedFetch(url, options);
  
  if (!response.ok) {
    const errorMessage = await extractErrorMessage(response);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

