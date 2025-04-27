import axios from 'axios';

// Determine if we're in production based on Vite's environment variable
const isProduction = import.meta.env.PROD;

// In production, use the local proxy, otherwise use the direct backend URL
// The proxy is configured in vite.config.ts to forward requests to the real backend
export const BACKEND_URL = isProduction 
  ? '/api' 
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim();

// Create an axios instance with the backend URL
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// For fetch API usage - ensure we return a complete URL
export const apiUrl = (path: string) => `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Helper function for API requests with fetch
export async function apiFetch(path: string, options: RequestInit = {}) {
  // Construct the complete URL to the backend
  const url = apiUrl(path);
  
  // Use the complete URL, not relative to current domain
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important for cookies/sessions
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response;
} 