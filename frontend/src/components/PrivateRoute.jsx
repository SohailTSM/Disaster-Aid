import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // If we're still loading, show a loading indicator
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a loading spinner
  }

  // Check if the user is authenticated
  const isAuth = isAuthenticated();
  
  // If not authenticated, redirect to login with the return URL
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no roles required, just render the children
  if (roles.length === 0) {
    return children;
  }

  // Check if user has any of the required roles
  const hasRequiredRole = roles.some(role => 
    user.role === role || 
    (Array.isArray(user.roles) && user.roles.includes(role))
  );

  // If user doesn't have required role, redirect to home or unauthorized
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // User is authenticated and has required role
  return children;
}
