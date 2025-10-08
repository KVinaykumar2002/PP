import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../lib/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
          const result = await authService.initializeAuth();
          
          if (result.success) {
            setUser(authService.getUser());
          } else {
            // Token is invalid or expired
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.signUp(fullName, email, password);
      
      if (result.success) {
        setUser(result.data.user);
        return { data: result.data, error: null };
      } else {
        const errorMessage = result.error || 'Registration failed';
        setError(errorMessage);
        return { data: null, error: { message: errorMessage } };
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.signIn(email, password);
      
      if (result.success) {
        setUser(result.data.user);
        return { data: result.data, error: null };
      } else {
        const errorMessage = result.error || 'Login failed';
        setError(errorMessage);
        return { data: null, error: { message: errorMessage } };
      }
    } catch (error) {
      console.error('Signin error:', error);
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.signOut();
      
      // Always clear user state regardless of API response
      setUser(null);
      
      if (result.success) {
        return { error: null };
      } else {
        console.error('Signout error:', result.error);
        return { error: { message: result.error || 'Logout failed' } };
      }
    } catch (error) {
      console.error('Signout error:', error);
      // Still clear user state even if there's an error
      setUser(null);
      return { error: { message: error.message || 'Logout failed' } };
    } finally {
      setLoading(false);
    }
  };

  // Get current user profile
  const getCurrentUser = async () => {
    try {
      const result = await authService.getCurrentUser();
      
      if (result.success) {
        setUser(result.data.user);
        return { data: result.data, error: null };
      } else {
        return { data: null, error: { message: result.error } };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return { data: null, error: { message: error.message } };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (!authService.isAuthenticated()) {
        setUser(null);
        return;
      }
      
      const result = await getCurrentUser();
      return result;
    } catch (error) {
      console.error('Refresh user error:', error);
      setError('Failed to refresh user data');
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    refreshUser,
    isAuthenticated: authService.isAuthenticated()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
