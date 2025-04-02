import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from "react";

// Minimum time the global loader should be visible (in milliseconds)
const MIN_LOADER_DISPLAY_TIME_MS = 300; // 2 seconds

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial fetch
  const [isAppLoading, setIsAppLoading] = useState<boolean>(false); // Global loader state
  const [error, setError] = useState<string | null>(null);

  // Refs to manage loader timing
  const loaderStartTimeRef = useRef<number | null>(null);
  const hideLoaderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to show the global loader - Declared early so it can be used in useEffects
  const showAppLoader = useCallback(() => {
    // Clear any pending timeout to hide the loader
    if (hideLoaderTimeoutRef.current) {
      clearTimeout(hideLoaderTimeoutRef.current);
      hideLoaderTimeoutRef.current = null;
    }
    // Record the start time
    loaderStartTimeRef.current = Date.now();
    setIsAppLoading(true);
  }, []);

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

  // Handle browser refresh to show loader
  useEffect(() => {
    const handleBeforeUnload = () => {
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
  }, []);

  // Check if we're coming back from a refresh
  useEffect(() => {
    const isRefreshing = sessionStorage.getItem('page_refreshing') === 'true';
    if (isRefreshing) {
      // Show loader and ensure it stays visible for the minimum time
      showAppLoader();
      // Clear the flag
      sessionStorage.removeItem('page_refreshing');
    }
  }, [showAppLoader]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideLoaderTimeoutRef.current) {
        clearTimeout(hideLoaderTimeoutRef.current);
      }
    };
  }, []);

  const fetchUserData = useCallback(async () => {
    // Show loader before fetching data
    showAppLoader();
    
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      hideAppLoader(); // Hide loader if no token
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      // Hide loader after fetching completes (will respect minimum display time)
      hideAppLoader();
    }
  }, [hideAppLoader, showAppLoader]);

  // Fetch user data on initial load
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Provide function to manually refresh user data
  const refreshUserData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    userData,
    setUserData,
    isLoading,
    error,
    refreshUserData,
    isAppLoading, // Add global state
    showAppLoader, // Add show function
    hideAppLoader  // Add hide function
  }), [userData, isLoading, error, refreshUserData, isAppLoading, showAppLoader, hideAppLoader]);

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