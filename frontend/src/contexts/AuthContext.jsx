import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigateTo, setNavigateTo] = useState(null);

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

  // Create a default NGO user for testing
  const createDefaultUser = () => {
    const defaultUser = {
      id: 'demo-ngo-1',
      name: 'Demo NGO',
      email: 'demo@ngo.org',
      role: 'ngo',
      organization: 'Demo NGO Foundation',
      contact: 'contact@demo.org'
    };
    
    // Store in demo users if not exists
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    if (!users.some(u => u.email === defaultUser.email)) {
      users.push(defaultUser);
      localStorage.setItem('demo_users', JSON.stringify(users));
    }
    
    return defaultUser;
  };

  useEffect(() => {
    // Create default user for testing
    createDefaultUser();
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // In a real app, you might want to validate the token with the server
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Demo NGO user
      if (email === 'demo@ngo.org') {
        const demoUser = {
          id: 'demo-ngo-1',
          name: 'Demo NGO',
          email: 'demo@ngo.org',
          role: 'ngo',
          organization: 'Demo NGO Foundation',
          contact: 'contact@demo.org'
        };
        
        // Generate a simple token for demo
        const token = btoa(JSON.stringify(demoUser));
        
        // Store the token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        // Update the auth state
        setUser(demoUser);
        
        // Show success message
        toast.success('Logged in as Demo NGO!');
        
        // Use setTimeout to ensure state updates before navigation
        setTimeout(() => {
          safeNavigate('/ngo');
        }, 0);
        
        return true;
      }
      
      // Demo Dispatcher user
      if (email === 'dispatcher@demo.org') {
        const demoDispatcher = {
          id: 'demo-dispatcher-1',
          name: 'Demo Dispatcher',
          email: 'dispatcher@demo.org',
          role: 'dispatcher',
          department: 'Emergency Response',
          contact: 'dispatcher@demo.org'
        };
        
        // Generate a simple token for demo
        const token = btoa(JSON.stringify(demoDispatcher));
        
        // Store the token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(demoDispatcher));
        
        // Update the auth state
        setUser(demoDispatcher);
        
        // Show success message
        toast.success('Logged in as Demo Dispatcher!');
        
        // Use setTimeout to ensure state updates before navigation
        setTimeout(() => {
          safeNavigate('/dispatcher');
        }, 0);
        
        return true;
      }
      
      // For other users, check against stored users
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('No user found with this email');
      }
      
      // In a real app, we would verify the password here
      // For demo, we'll just check if any password was provided
      if (!password) {
        throw new Error('Invalid password');
      }
      
      // Generate a simple token for demo
      const token = btoa(JSON.stringify(user));
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      toast.success('Login successful');
      
      // Redirect based on user role
      const redirectPath = user.role === 'dispatcher' ? '/dispatcher' : '/ngo';
      safeNavigate(redirectPath);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      // For demo purposes, we'll create a mock user object
      const mockUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'ngo',
        organization: userData.organization || '',
        contact: userData.contact || ''
      };
      
      // Generate a simple token for demo
      const token = btoa(JSON.stringify(mockUser));
      
      // Get existing users or initialize empty array
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      // Check if user already exists
      if (users.some(u => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }
      
      // Add new user
      users.push(mockUser);
      localStorage.setItem('demo_users', JSON.stringify(users));
      
      // Log the user in
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      toast.success('Registration successful');
      
      // Redirect based on user role
      const redirectPath = mockUser.role === 'dispatcher' ? '/dispatcher' : '/ngo';
      safeNavigate(redirectPath);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Registration failed. Please try again.';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    safeNavigate('/login');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (role) => {
    return user?.role === role;
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
        setNavigate, // Add setNavigate to the context value
      }}
    >
      {!loading && children}
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
