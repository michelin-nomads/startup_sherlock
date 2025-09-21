export const API_BASE_URL = process.env.BE_HOST_URL;

// Helper function to build full API URLs  
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${API_BASE_URL}/${cleanPath}`;
}
