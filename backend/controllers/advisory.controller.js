const asyncHandler = require("express-async-handler");
const Advisory = require("../models/advisory.model");

// GET /api/advisories (public - get all active advisories)
const getActiveAdvisories = asyncHandler(async (req, res) => {
  const advisories = await Advisory.find({ active: true })
    .populate("authorityId", "name")
    .sort({ createdAt: -1 });
  res.json({ advisories });
});

// GET /api/advisories/all (authority - get all advisories including inactive)
const getAllAdvisories = asyncHandler(async (req, res) => {
  const advisories = await Advisory.find()
    .populate("authorityId", "name")
    .sort({ createdAt: -1 });
  res.json({ advisories });
});

// POST /api/advisories (authority)
const createAdvisory = asyncHandler(async (req, res) => {
  const { title, content, severity, active } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error("Title and content are required");
  }

  const advisory = await Advisory.create({
    title,
    content,
    severity: severity || "Medium",
    active: active !== undefined ? active : true,
    authorityId: req.user._id,
  });

  const populatedAdvisory = await Advisory.findById(advisory._id).populate(
    "authorityId",
    "name"
  );

  res.status(201).json({ advisory: populatedAdvisory });
});

// PUT /api/advisories/:id (authority)
const updateAdvisory = asyncHandler(async (req, res) => {
  const { title, content, severity, active } = req.body;

  const advisory = await Advisory.findById(req.params.id);

  if (!advisory) {
    res.status(404);
    throw new Error("Advisory not found");
  }

  // Update fields if provided
  if (title) advisory.title = title;
  if (content) advisory.content = content;
  if (severity) advisory.severity = severity;
  if (active !== undefined) advisory.active = active;

  const updatedAdvisory = await advisory.save();
  const populatedAdvisory = await Advisory.findById(
    updatedAdvisory._id
  ).populate("authorityId", "name");

  res.json({ advisory: populatedAdvisory });
});

// DELETE /api/advisories/:id (authority)
const deleteAdvisory = asyncHandler(async (req, res) => {
  const advisory = await Advisory.findById(req.params.id);

  if (!advisory) {
    res.status(404);
    throw new Error("Advisory not found");
  }

  await advisory.deleteOne();
  res.json({ message: "Advisory deleted successfully" });
});

// PUT /api/advisories/:id/toggle (authority - toggle active status)
const toggleAdvisoryStatus = asyncHandler(async (req, res) => {
  const advisory = await Advisory.findById(req.params.id);

  if (!advisory) {
    res.status(404);
    throw new Error("Advisory not found");
  }

  advisory.active = !advisory.active;
  const updatedAdvisory = await advisory.save();
  const populatedAdvisory = await Advisory.findById(
    updatedAdvisory._id
  ).populate("authorityId", "name");

  res.json({ advisory: populatedAdvisory });
});

module.exports = {
  getActiveAdvisories,
  getAllAdvisories,
  createAdvisory,
  updateAdvisory,
  deleteAdvisory,
  toggleAdvisoryStatus,
};
