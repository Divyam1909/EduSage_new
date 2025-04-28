//@ts-nocheck
import axios from 'axios';

// Determine if we're in production or deployed on Vercel
const isProduction = import.meta.env.PROD;
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

// Get the backend URLs
const productionBackendUrl = 'https://edusagenew-production-5fef.up.railway.app';
const developmentBackendUrl = 'http://localhost:5000';

// Choose backend URL based on environment
// Always use production backend URL when deployed on Vercel
export const BACKEND_URL = isProduction || isVercel ? productionBackendUrl : developmentBackendUrl;

// Log the backend URL being used
console.log(`Using backend URL: ${BACKEND_URL}`);
console.log(`Environment: ${isProduction ? 'Production' : 'Development'}, Vercel: ${isVercel}`);

// Create an axios instance with the backend URL
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Add request interceptor to handle FormData requests properly
apiClient.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    // For FormData, let the browser set the Content-Type with boundary
    delete config.headers['Content-Type'];
  }
  return config;
});

// For fetch API usage - ensure we return a complete URL
export const apiUrl = (path: string) => `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Helper function for API requests with fetch
export async function apiFetch(path: string, options: RequestInit = {}) {
  // Construct the complete URL to the backend
  const url = apiUrl(path);
  
  console.log("Making API request to:", url);
  
  try {
    // Create headers object
    const headers = { ...options.headers };
    
    // For FormData requests, don't set Content-Type to let browser handle it
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    } else if (!headers['Content-Type']) {
      // Default content type for non-FormData requests
      headers['Content-Type'] = 'application/json';
    }
    
    // Log request details (without sensitive data)
    console.log("Request method:", options.method || 'GET');
    console.log("Request headers:", headers);
    
    if (options.body && typeof options.body === 'string' && headers['Content-Type'] === 'application/json') {
      try {
        const bodyObj = JSON.parse(options.body);
        console.log("Request body (sanitized):", {
          ...bodyObj,
          password: bodyObj.password ? '[REDACTED]' : undefined,
          realPassword: bodyObj.realPassword ? '[REDACTED]' : undefined
        });
      } catch (e) {
        console.log("Could not parse request body for logging");
      }
    }
    
    // Use the complete URL, not relative to current domain
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for cookies/sessions
      headers
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
        console.error(`API error (${response.status}):`, errorData);
      } catch (e) {
        errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
      }
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
} 