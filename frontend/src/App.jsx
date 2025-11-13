import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Home from "./pages/Home";
import RequestForm from "./pages/RequestForm";
import Dispatcher from "./pages/Dispatcher";
import NGO from "./pages/NGO";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequestDetails from "./pages/RequestDetails";
import TrackStatus from "./pages/TrackStatus";
import PublicAdvisories from "./pages/PublicAdvisories";
import Authority from "./pages/Authority";
import Admin from "./pages/Admin";

// Components
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected route component for authenticated users
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.some((role) => hasRole(role))) {
    return <Navigate to="/" replace />;
  }

  // Make sure to return the children directly, not as a function
  return typeof children === "function" ? children() : children;
};

function AppContent() {
  const { setNavigate } = useAuth();
  const navigate = useNavigate();

  // Set up navigation in auth context
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />
      <Routes>
        {/* Public Routes - Accessible to everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/track-status" element={<TrackStatus />} />
        <Route path="/advisories" element={<PublicAdvisories />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dispatcher"
          element={
            <ProtectedRoute roles={["dispatcher"]}>
              <Dispatcher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request/:id"
          element={
            <ProtectedRoute roles={["dispatcher"]}>
              <RequestDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ngo"
          element={
            <ProtectedRoute roles={["ngo_member"]}>
              <NGO />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/authority"
          element={
            <ProtectedRoute roles={["authority"]}>
              <Authority />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to appropriate page based on auth status */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
