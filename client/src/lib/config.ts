// API Configuration
// For development: uses Vite proxy (/api -> http://localhost:5000/api)
// For production: set VITE_API_URL environment variable

export const API_URL = import.meta.env.VITE_API_URL || '';

// Helper to get full API URL
export function getApiUrl(path: string): string {
  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }
  return `${API_URL}/${path}`;
}
