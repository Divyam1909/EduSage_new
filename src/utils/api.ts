//@ts-nocheck
import axios from 'axios';

// Get the backend URL from environment variables, trim any whitespace
const backendUrl = 'https://edusagenew-production-5fef.up.railway.app';

// Use a CORS proxy for production environment
const corsProxy = 'https://cors-anywhere.herokuapp.com/';

// Use the full backend URL directly
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
  // Determine if we're in production
  const isProduction = window.location.hostname !== 'localhost';
  
  // Construct the complete URL to the backend
  let url = apiUrl(path);
  
  // In production, use the CORS proxy
  if (isProduction) {
    // Use the Vercel proxy configured in vercel.json instead of direct calls
    url = `/api${path.startsWith('/') ? path : `/${path}`}`;
  }
  
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