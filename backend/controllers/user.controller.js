const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

// POST /api/users/create-dispatcher (admin)
const createDispatcher = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    passwordHash,
    phone,
    role: "dispatcher",
  });

  await user.save();
  res.status(201).json({
    message: "Dispatcher created successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/users/create-authority (admin)
const createAuthority = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    passwordHash,
    phone,
    role: "authority",
  });

  await user.save();
  res.status(201).json({
    message: "Authority created successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// GET /api/users/dispatchers (admin)
const listDispatchers = asyncHandler(async (req, res) => {
  const dispatchers = await User.find({ role: "dispatcher" })
    .select("-passwordHash")
    .sort({ createdAt: -1 });
  res.json({ users: dispatchers });
});

// GET /api/users/authorities (admin)
const listAuthorities = asyncHandler(async (req, res) => {
  const authorities = await User.find({ role: "authority" })
    .select("-passwordHash")
    .sort({ createdAt: -1 });
  res.json({ users: authorities });
});

// PUT /api/users/:id/suspend (admin)
const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    res.status(403);
    throw new Error("Cannot suspend admin users");
  }

  user.suspended = true;
  user.suspensionMetadata = {
    suspendedBy: req.user._id,
    suspendedAt: new Date(),
    suspensionReason: req.body.reason || "",
  };
  await user.save();

  res.json({
    message: "User suspended",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      suspended: user.suspended,
    },
  });
});

// PUT /api/users/:id/unsuspend (admin)
const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.suspended = false;
  await user.save();

  res.json({
    message: "User unsuspended",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      suspended: user.suspended,
    },
  });
});

// DELETE /api/users/:id (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    res.status(403);
    throw new Error("Cannot delete admin users");
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted successfully" });
});

module.exports = {
  createDispatcher,
  createAuthority,
  listDispatchers,
  listAuthorities,
  suspendUser,
  unsuspendUser,
  deleteUser,
};
