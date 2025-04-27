//@ts-nocheck
import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from "react";
import { apiFetch } from "../utils/api";

// Configuration constants
const MIN_LOADER_DISPLAY_TIME_MS = 1;
// Set this to false to disable all loaders throughout the application
const LOADER_ENABLED = false;

// Define the shape of our context type
interface UserContextType {
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean; // Initial user data loading
  error: string | null;
  refreshUserData: () => Promise<void>;
  isAppLoading: boolean; // Global loader state
  showAppLoader: () => void; // Function to show global loader
  hideAppLoader: () => void; // Function to hide global loader
  toggleTestLoader: (duration?: number) => void; // Function to toggle loader for testing
  loaderEnabled: boolean; // Flag to enable/disable loader
  setLoaderEnabled: (enabled: boolean) => void; // Function to set loader state
}

// Add this to window for global access
declare global {
  interface Window {
    toggleLoader?: (duration?: number) => void;
    enableLoader?: () => void;
    disableLoader?: () => void;
    isLoaderEnabled?: () => boolean;
  }
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial fetch
  const [isAppLoading, setIsAppLoading] = useState<boolean>(false); // Global loader state
  const [error, setError] = useState<string | null>(null);
  const [loaderEnabled, setLoaderEnabled] = useState<boolean>(LOADER_ENABLED); // Use constant for initial value
  
  // Refs to manage loader timing
  const loaderStartTimeRef = useRef<number | null>(null);
  const hideLoaderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle loader enabled state changes
  useEffect(() => {
    if (!loaderEnabled && isAppLoading) {
      // Immediately hide loader if it was showing when disabled
      setIsAppLoading(false);
      loaderStartTimeRef.current = null;
      if (hideLoaderTimeoutRef.current) {
        clearTimeout(hideLoaderTimeoutRef.current);
        hideLoaderTimeoutRef.current = null;
      }
      console.log('Loader disabled - hiding any visible loaders');
    }
  }, [loaderEnabled, isAppLoading]);

  // Function to show the global loader
  const showAppLoader = useCallback(() => {
    // Only show loader if enabled
    if (!loaderEnabled) {
      console.log('Loader is disabled - not showing');
      return;
    }
    
    // Clear any pending timeout to hide the loader
    if (hideLoaderTimeoutRef.current) {
      clearTimeout(hideLoaderTimeoutRef.current);
      hideLoaderTimeoutRef.current = null;
    }
    // Record the start time
    loaderStartTimeRef.current = Date.now();
    setIsAppLoading(true);
  }, [loaderEnabled]);

  // Function to hide the global loader
  const hideAppLoader = useCallback(() => {
    if (!loaderStartTimeRef.current) {
      // Loader wasn't shown or already hidden
      setIsAppLoading(false);
      return;
    }

    const elapsedTime = Date.now() - loaderStartTimeRef.current;
    const remainingTime = MIN_LOADER_DISPLAY_TIME_MS - elapsedTime;

    if (remainingTime > 0) {
      // If minimum time hasn't passed, wait before hiding
      hideLoaderTimeoutRef.current = setTimeout(() => {
        setIsAppLoading(false);
        loaderStartTimeRef.current = null; // Reset start time
        hideLoaderTimeoutRef.current = null;
      }, remainingTime);
    } else {
      // Minimum time already passed, hide immediately
      setIsAppLoading(false);
      loaderStartTimeRef.current = null; // Reset start time
    }
  }, []);

  // Simple function to toggle loader for testing purposes
  const toggleTestLoader = useCallback((duration = 3000) => {
    if (isAppLoading) {
      hideAppLoader();
      console.log('Loader hidden (test mode)');
    } else {
      showAppLoader();
      console.log(`Loader shown for ${duration}ms (test mode)`);
      
      // Auto-hide after duration
      setTimeout(() => {
        hideAppLoader();
      }, duration);
    }
  }, [showAppLoader, hideAppLoader, isAppLoading]);

  // Make loader controls available globally
  useEffect(() => {
    window.toggleLoader = toggleTestLoader;
    window.enableLoader = () => setLoaderEnabled(true);
    window.disableLoader = () => setLoaderEnabled(false);
    window.isLoaderEnabled = () => loaderEnabled;
    
    console.log('Loader controls available:');
    console.log('- window.enableLoader() - Enable loader');
    console.log('- window.disableLoader() - Disable loader');
    console.log('- window.isLoaderEnabled() - Check if loader is enabled');
    console.log('- window.toggleLoader(duration) - Test loader');
    
    return () => {
      window.toggleLoader = undefined;
      window.enableLoader = undefined;
      window.disableLoader = undefined;
      window.isLoaderEnabled = undefined;
    };
  }, [toggleTestLoader, loaderEnabled]);

  // Handle browser refresh to show loader
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only show loader on refresh if enabled
      if (!loaderEnabled) return;
      
      // Show loader when page is about to refresh
      if (hideLoaderTimeoutRef.current) {
        clearTimeout(hideLoaderTimeoutRef.current);
        hideLoaderTimeoutRef.current = null;
      }
      loaderStartTimeRef.current = Date.now();
      setIsAppLoading(true);
      
      // Store in sessionStorage that we're refreshing
      // This will be checked when the page loads again
      sessionStorage.setItem('page_refreshing', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loaderEnabled]);

  // Check if we're coming back from a refresh
  useEffect(() => {
    const isRefreshing = sessionStorage.getItem('page_refreshing') === 'true';
    if (isRefreshing && loaderEnabled) {
      // Show loader and ensure it stays visible for the minimum time
      showAppLoader();
      // Clear the flag
      sessionStorage.removeItem('page_refreshing');
    } else if (isRefreshing) {
      // Just clear the flag if loader is disabled
      sessionStorage.removeItem('page_refreshing');
    }
  }, [showAppLoader, loaderEnabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideLoaderTimeoutRef.current) {
        clearTimeout(hideLoaderTimeoutRef.current);
      }
    };
  }, []);

  const fetchUserData = useCallback(async () => {
    // Show loader before fetching data (only if enabled)
    if (loaderEnabled) {
      showAppLoader();
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      if (loaderEnabled) {
        hideAppLoader(); // Hide loader if no token
      }
      return;
    }

    setIsLoading(true);
    try {
      // Add a short delay for development to ensure the loader is shown
      // Skip this if loader is disabled
      if (loaderEnabled) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const response = await apiFetch("profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      // Hide loader after fetching completes (will respect minimum display time)
      setIsLoading(false);
      if (loaderEnabled) {
        hideAppLoader();
      }
    }
  }, [hideAppLoader, showAppLoader, loaderEnabled]);

  // Fetch user data on initial load
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Provide function to manually refresh user data
  const refreshUserData = useCallback(async () => {
    // Show loader when manually refreshing data (only if enabled)
    if (loaderEnabled) {
      showAppLoader();
    }
    
    try {
      await fetchUserData();
    } catch (error) {
      console.error("Error refreshing user data:", error);
      // Make sure to hide loader even on error (if it was shown)
      if (loaderEnabled) {
        hideAppLoader();
      }
    }
  }, [fetchUserData, showAppLoader, hideAppLoader, loaderEnabled]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    userData,
    setUserData,
    isLoading,
    error,
    refreshUserData,
    isAppLoading, // Add global state
    showAppLoader, // Add show function
    hideAppLoader, // Add hide function
    toggleTestLoader, // Add test function
    loaderEnabled, // Add flag
    setLoaderEnabled // Add toggle function
  }), [userData, isLoading, error, refreshUserData, isAppLoading, showAppLoader, hideAppLoader, toggleTestLoader, loaderEnabled]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}; 