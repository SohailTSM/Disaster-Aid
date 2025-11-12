const asyncHandler = require('express-async-handler');
const Organization = require('../models/organization.model');

// POST /api/organizations
// Allows an admin or dispatcher to add a new NGO to the platform
const createOrganization = asyncHandler(async (req, res) => {
  const { name, contactEmail, contactPhone, address, location } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Organization name is required');
  }
  const org = new Organization({
    name,
    contactEmail,
    contactPhone,
    address,
    location: location || { type: 'Point', coordinates: [0, 0] },
    verificationStatus: 'pending'
  });
  await org.save();
  res.status(201).json({ message: 'Organization created', organization: org });
});

// GET /api/organizations?verified=true
const listOrganizations = asyncHandler(async (req, res) => {
  const { verified } = req.query;
  const filter = {};
  if (verified === 'true') filter.verificationStatus = 'verified';
  const orgs = await Organization.find(filter).sort({ createdAt: -1 });
  res.json({ organizations: orgs });
});

// PUT /api/organizations/:id/verify
const verifyOrganization = asyncHandler(async (req, res) => {
  const orgId = req.params.id;
  const { status } = req.body; // expected 'verified' or 'rejected' or 'pending'
  if (!['verified', 'rejected', 'pending'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  const org = await Organization.findById(orgId);
  if (!org) {
    res.status(404);
    throw new Error('Organization not found');
  }
  org.verificationStatus = status;
  await org.save();
  res.json({ message: 'Organization status updated', organization: org });
});

module.exports = { createOrganization, listOrganizations, verifyOrganization };
