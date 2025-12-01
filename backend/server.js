require("dotenv").config({ debug: true });

// Debug environment variables
console.log("Environment Variables:");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "***" : "Not set!");
console.log("MONGO_URI:", process.env.MONGO_URI ? "***" : "Not set!");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

// Import routes
const authRoutes = require("./routes/auth.routes");
const orgRoutes = require("./routes/organizations.routes");
const reqRoutes = require("./routes/requests.routes");
const assignRoutes = require("./routes/assignments.routes");
const userRoutes = require("./routes/users.routes");
const advisoryRoutes = require("./routes/advisories.routes");
const analyticsRoutes = require("./routes/analytics.routes");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  FRONTEND_URL,
].filter(Boolean);

// CORS configuration middleware
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  // Always set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
};

// Apply CORS to all routes
app.use(corsMiddleware);

// Error handling middleware (removed duplicate)
app.use((err, req, res, next) => {
  // Preserve CORS headers
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  // Handle the error
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// simple health route
app.get("/", (req, res) => res.send("DisasterAid API (Phase 1)"));

app.use("/api/auth", authRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/requests", reqRoutes);
app.use("/api/assignments", assignRoutes);
app.use("/api/users", userRoutes);
app.use("/api/advisories", advisoryRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const requestComponentRoutes = require("./routes/requestComponents.routes");
app.use("/api/request-components", requestComponentRoutes);
