const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');

// helper to set cookie
const setTokenCookie = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true', // set true in prod + https
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  };
  res.cookie('token', token, cookieOpts);
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, organization } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Optionally create organization if role is ngo_member and organization data provided
  let organizationId = req.body.organizationId;
  if (role === 'ngo_member' && organization) {
    const org = new Organization({
      name: organization.name,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      address: organization.address,
      location: organization.location || { type: 'Point', coordinates: [0, 0] }
    });
    await org.save();
    organizationId = org._id;
  }

  const user = new User({ name, email, passwordHash, phone, role, organizationId });
  await user.save();

  setTokenCookie(res, { id: user._id });

  res.status(201).json({
    message: 'Registered',
    user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId }
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  setTokenCookie(res, { id: user._id });

  res.json({ message: 'Logged in', user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId } });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash').populate('organizationId');
  res.json({ user });
});

module.exports = { register, login, logout, me };
