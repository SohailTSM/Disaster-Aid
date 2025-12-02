const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");

// helper to set cookie
const setTokenCookie = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only secure in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/", // Ensure cookie is available for all paths
  };
  res.cookie("token", token, cookieOpts);
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, organization } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Optionally create organization if role is ngo_member and organization data provided
  let organizationId = req.body.organizationId;
  if (role === "ngo_member" && organization) {
    const org = new Organization({
      name: organization.name,
      headName: organization.headName,
      contactEmail: organization.contactEmail || email,
      contactPhone: organization.contactPhone,
      address: organization.address,
      location: organization.location,
      offers: organization.offers || [],
    });
    await org.save();
    organizationId = org._id;
  }

  const user = new User({
    name,
    email,
    passwordHash,
    phone,
    role,
    organizationId,
  });
  await user.save();

  setTokenCookie(res, { id: user._id });

  res.status(201).json({
    message: "Registered",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Provide email and password");
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  // If user is ngo_member, check if their organization is approved
  if (user.role === "ngo_member" && user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (!org || !org.approved) {
      res.status(403);
      throw new Error("Organization not approved by admin yet.");
    }
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  setTokenCookie(res, { id: user._id });

  res.json({
    message: "Logged in",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-passwordHash")
    .populate("organizationId");
  res.json({ user });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public - because token will be in httpOnly cookie
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401);
    throw new Error("No refresh token provided");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    // Generate new token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    // Set new token in cookie
    setTokenCookie(res, tokenPayload);

    res.status(200).json({
      success: true,
      token: jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401);
    throw new Error("Invalid refresh token");
  }
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Please provide old and new password");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Verify old password
  const match = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!match) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password
  user.passwordHash = passwordHash;
  await user.save();

  res.json({ message: "Password changed successfully" });
});

module.exports = {
  register,
  login,
  logout,
  me,
  refreshToken,
  changePassword,
};
