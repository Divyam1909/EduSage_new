//@ts-nocheck
import axios from 'axios';

// Determine if we're in production
const isProduction = import.meta.env.PROD;

// Get the backend URL directly without the proxy
const directBackendUrl = 'https://edusagenew-production-5fef.up.railway.app';

// In production, use the direct backend URL
export const BACKEND_URL = directBackendUrl;

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
  
  try {
    // Use the complete URL, not relative to current domain
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for cookies/sessions
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
} 