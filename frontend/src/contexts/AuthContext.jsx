import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigateTo, setNavigateTo] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // This will be called by the RouterProvider after the router is set up
  const setNavigate = useCallback((navigate) => {
    setNavigateTo(() => navigate);
  }, []);

  // Helper function to handle navigation safely
  const safeNavigate = useCallback((to) => {
    if (navigateTo) {
      navigateTo(to);
    } else {
      console.warn('Navigation not available yet');
    }
  }, [navigateTo]);

  // Load user data from token
  const loadUser = useCallback(async () => {
    try {
      // In a real app, you might want to validate the token with the server
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token, loadUser]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { token: authToken, user: userData } = response;
      
      // Store token and user data
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(authToken);
      setUser(userData);
      
      // Show success message
      toast.success(`Welcome back, ${userData.name || 'User'}!`);
      
      // Return the user data for role-based routing
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      return false;
    }
  };
  
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token: authToken, user: registeredUser } = response;
      
      // Store token and user data
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      
      // Update state
      setToken(authToken);
      setUser(registeredUser);
      
      // Show success message
      toast.success('Registration successful!');
      
      // Redirect based on role
      const redirectPath = registeredUser.role === 'ngo' ? '/ngo' : '/';
      safeNavigate(redirectPath);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    }
  };
  
  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state
    setToken(null);
    setUser(null);
    
    // Redirect to login
    safeNavigate('/login');
  };
  
  const isAuthenticated = useCallback(() => {
    // Check both token and user data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return !!(storedToken && storedUser);
  }, []);
  
  const hasRole = (role) => {
    return user?.role === role || user?.roles?.includes(role);
  };
  
  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role) || 
           (Array.isArray(user.roles) && user.roles.some(r => roles.includes(r)));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        hasRole,
        hasAnyRole,
        setNavigate, // Expose setNavigate for the router
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
