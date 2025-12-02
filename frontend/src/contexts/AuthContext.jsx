import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/api";
import { toast } from "react-toastify";

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
  const safeNavigate = useCallback(
    (to) => {
      if (navigateTo) {
        navigateTo(to);
      } else {
        console.warn("Navigation not available yet");
      }
    },
    [navigateTo]
  );

  // Load user data on mount by calling /me endpoint
  const loadUser = useCallback(async () => {
    try {
      // Call the /me endpoint which will use the httpOnly cookie
      const response = await authService.me();
      if (response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Only log error if it's not a 401 (which is expected when not logged in)
      if (error.response?.status !== 401) {
        console.error("Error loading user data", error);
      }
      // If we can't load user, they're not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user: userData } = response;

      // Cookie is automatically set by the backend
      // Just update the user state
      setUser(userData);

      // Show success message
      toast.success(`Welcome back, ${userData.name || "User"}!`);

      // Return the user data for role-based routing
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error.response?.data?.message || "Login failed. Please try again."
      );
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);

      // For NGO members, don't auto-login - they need admin approval first
      if (userData.role === "ngo_member") {
        // Show success message but don't store credentials
        toast.success(
          "NGO registration submitted! Please wait for admin approval."
        );
        return { success: true, requiresApproval: true };
      }

      // For other roles (dispatcher, etc.), proceed with auto-login
      const { user: registeredUser } = response;

      // Cookie is automatically set by the backend
      // Just update the user state
      setUser(registeredUser);

      // Show success message
      toast.success("Registration successful!");

      // Redirect based on role
      const redirectPath =
        registeredUser.role === "dispatcher" ? "/dispatcher" : "/";
      safeNavigate(redirectPath);

      return { success: true, requiresApproval: false };
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
      throw error;
    }
  };

  const logout = () => {
    // Call logout endpoint to clear httpOnly cookie
    authService.logout().catch((err) => console.error("Logout error:", err));

    // Reset state
    setUser(null);

    // Redirect to login
    safeNavigate("/login");
  };

  const isAuthenticated = useCallback(() => {
    // Check if user is loaded (cookie validation happens on server)
    return !!user;
  }, [user]);

  const hasRole = (role) => {
    return user?.role === role || user?.roles?.includes(role);
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return (
      roles.includes(user.role) ||
      (Array.isArray(user.roles) && user.roles.some((r) => roles.includes(r)))
    );
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
