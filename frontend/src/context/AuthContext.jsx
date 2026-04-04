import { createContext, useContext, useState, useEffect } from 'react';
import { authService, childService } from '../services';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [preloadedData, setPreloadedData] = useState(null);

  // Auto logout after 15 minutes of inactivity
  useEffect(() => {
    let logoutTimer;
    let activityTimer;

    const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

    const resetTimer = () => {
      // Clear existing timers
      if (logoutTimer) clearTimeout(logoutTimer);
      if (activityTimer) clearTimeout(activityTimer);

      // Set new logout timer
      if (user) {
        logoutTimer = setTimeout(() => {
          logout();
          setSessionExpired(true);
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }, SESSION_TIMEOUT);
      }
    };

    const handleActivity = () => {
      // Clear activity timer to prevent too many resets
      if (activityTimer) clearTimeout(activityTimer);
      
      // Debounce activity events
      activityTimer = setTimeout(() => {
        resetTimer();
      }, 1000);
    };

    // Only set up listeners if user is logged in
    if (user) {
      resetTimer();

      // Listen for user activity
      window.addEventListener('mousedown', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('touchstart', handleActivity);
    }

    // Cleanup
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (activityTimer) clearTimeout(activityTimer);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user]);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Preload essential data for existing session
      preloadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  // Preload essential data after login
  const preloadUserData = async () => {
    try {
      // Fetch all essential data in parallel
      const [childrenResponse] = await Promise.all([
        childService.getChildren().catch(() => ({ data: [] }))
        // Add more API calls here as needed (activities, reports, etc.)
      ]);
      
      setPreloadedData({
        children: childrenResponse.data || []
      });
    } catch (err) {
      console.error('Error preloading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // Support both old signature (email, password) and new signature (credentials object)
    let loginData;
    if (typeof credentials === 'string') {
      // Old signature: login(email, password)
      const password = arguments[1];
      loginData = { email: credentials, password };
    } else {
      // New signature: login({ email/phoneNumber, password })
      loginData = credentials;
    }
    
    const response = await authService.login(loginData);
    setUser(response.data.user);
    
    // Preload user data immediately after login
    await preloadUserData();
    
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response;
  };

  const verifyOtp = async (verifyData) => {
    // Support both old signature (email, otp) and new signature (verifyData object)
    let otpData;
    if (typeof verifyData === 'string') {
      // Old signature: verifyOtp(email, otp)
      const otp = arguments[1];
      otpData = { email: verifyData, otp };
    } else {
      // New signature: verifyOtp({ email/phoneNumber, otp })
      otpData = verifyData;
    }
    
    const response = await authService.verifyOtp(otpData);
    setUser(response.data.user);
    
    // Preload user data immediately after OTP verification
    await preloadUserData();
    
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setPreloadedData(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyOtp,
    logout,
    isAuthenticated: !!user,
    sessionExpired,
    setSessionExpired,
    preloadedData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
