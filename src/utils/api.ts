import axios from 'axios';

// Get the backend URL from environment variables, trim any whitespace
const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim();

// Use the full backend URL directly to avoid proxy issues
export const BACKEND_URL = backendUrl;

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
  
  console.log("Making API request to:", url);
  
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