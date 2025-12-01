const asyncHandler = require("express-async-handler");
const Organization = require("../models/organization.model");
const Request = require("../models/request.model");
const User = require("../models/user.model");
const GeospatialService = require("../services/geospatial.service");
// GET /api/organizations/pending (admin)
const listPendingOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find({ approved: false }).sort({
    createdAt: -1,
  });
  res.json({ organizations: orgs });
});

// PUT /api/organizations/:id/approve (admin)
const approveOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  org.approved = true;
  org.verificationStatus = "verified";
  org.approvalMetadata = org.approvalMetadata || {};
  org.approvalMetadata.approvedBy = req.user._id;
  org.approvalMetadata.approvedAt = new Date();
  await org.save();
  res.json({ message: "Organization approved", organization: org });
});

// PUT /api/organizations/:id/reject (admin)
const rejectOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  org.approved = false;
  org.verificationStatus = "rejected";
  org.approvalMetadata = org.approvalMetadata || {};
  org.approvalMetadata.rejectedAt = new Date();
  org.approvalMetadata.rejectionReason = req.body.reason || "";
  await org.save();
  res.json({ message: "Organization rejected", organization: org });
});

// DELETE /api/organizations/:id (admin) - Data retention (delete org and optionally users/requests)
const deleteOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findByIdAndDelete(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  // Optionally, delete users and requests associated with this org
  await User.deleteMany({ organizationId: org._id });
  await Request.deleteMany({ organizationId: org._id });
  res.json({ message: "Organization and related data deleted" });
});

// GET /api/organizations/export/incidents (admin) - Export all requests as JSON
const exportIncidents = asyncHandler(async (req, res) => {
  const requests = await Request.find({});
  res.setHeader("Content-Disposition", "attachment; filename=incidents.json");
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(requests, null, 2));
});

// POST /api/organizations
// Allows an admin or dispatcher to add a new NGO to the platform
const createOrganization = asyncHandler(async (req, res) => {
  const {
    name,
    headName,
    contactEmail,
    contactPhone,
    address,
    location,
    offers,
  } = req.body;
  if (!name || !headName || !contactPhone || !address || !location) {
    res.status(400);
    throw new Error(
      "NGO name, head name, contact, address, and location are required"
    );
  }

  // Validate location
  if (!location.coordinates || location.coordinates.length !== 2) {
    res.status(400);
    throw new Error("Valid location coordinates are required");
  }

  const org = new Organization({
    name,
    headName,
    contactEmail,
    contactPhone,
    address,
    location,
    offers: offers || [],
    verificationStatus: "pending",
  });
  await org.save();
  res.status(201).json({ message: "Organization created", organization: org });
});

// GET /api/organizations?verified=true
const listOrganizations = asyncHandler(async (req, res) => {
  const { verified } = req.query;
  const filter = {};
  if (verified === "true") filter.verificationStatus = "verified";
  const orgs = await Organization.find(filter).sort({ createdAt: -1 });
  res.json({ organizations: orgs });
});

// PUT /api/organizations/:id/verify
const verifyOrganization = asyncHandler(async (req, res) => {
  const orgId = req.params.id;
  const { status } = req.body; // expected 'verified' or 'rejected' or 'pending'
  if (!["verified", "rejected", "pending"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }
  const org = await Organization.findById(orgId);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  org.verificationStatus = status;
  await org.save();
  res.json({ message: "Organization status updated", organization: org });
});

// PUT /api/organizations/:id/suspend (admin)
const suspendOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  org.suspended = true;
  org.suspensionMetadata = org.suspensionMetadata || {};
  org.suspensionMetadata.suspendedBy = req.user._id;
  org.suspensionMetadata.suspendedAt = new Date();
  org.suspensionMetadata.suspensionReason = req.body.reason || "";
  await org.save();

  // Also suspend all users from this organization
  await User.updateMany(
    { organizationId: org._id },
    {
      suspended: true,
      suspensionMetadata: {
        suspendedBy: req.user._id,
        suspendedAt: new Date(),
        suspensionReason: `Organization suspended: ${req.body.reason || ""}`,
      },
    }
  );

  res.json({ message: "Organization suspended", organization: org });
});

// PUT /api/organizations/:id/unsuspend (admin)
const unsuspendOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  org.suspended = false;
  org.suspensionMetadata = org.suspensionMetadata || {};
  org.suspensionMetadata.unsuspendedAt = new Date();
  await org.save();

  // Also unsuspend all users from this organization
  await User.updateMany({ organizationId: org._id }, { suspended: false });

  res.json({ message: "Organization unsuspended", organization: org });
});

// PUT /api/organizations/my/resources (ngo_member) - Update own organization's resources
const updateMyResources = asyncHandler(async (req, res) => {
  if (!req.user.organizationId) {
    res.status(400);
    throw new Error("User has no organization");
  }

  const { offers } = req.body;

  if (!offers || !Array.isArray(offers)) {
    res.status(400);
    throw new Error("Offers array is required");
  }

  const org = await Organization.findById(req.user.organizationId);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }

  org.offers = offers;
  await org.save();

  res.json({ message: "Resources updated successfully", organization: org });
});

// GET /api/organizations/my (ngo_member) - Get own organization details
const getMyOrganization = asyncHandler(async (req, res) => {
  if (!req.user.organizationId) {
    res.status(400);
    throw new Error("User has no organization");
  }

  const org = await Organization.findById(req.user.organizationId);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }

  res.json({ organization: org });
});

// GET /api/organizations/matched/:requestId (dispatcher) - Get geospatially matched NGOs for a request
const getMatchedNGOsForRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.requestId;
  const { maxDistance, limit } = req.query;

  const request = await Request.findById(requestId);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  // Check if request has valid location
  if (!request.location || !request.location.coordinates || request.location.coordinates.length !== 2) {
    // Fall back to returning all eligible NGOs without distance sorting
    const Organization = require("../models/organization.model");
    const allNGOs = await Organization.find({
      $or: [
        { approved: true },
        { verificationStatus: "verified" }
      ],
      suspended: { $ne: true },
    }).limit(parseInt(limit) || 20);

    const ngosWithDefaults = allNGOs.map(ngo => ({
      ...ngo.toObject(),
      distance: null,
      distanceText: "Distance unknown",
      matchedNeeds: [],
      availableResources: ngo.offers || [],
      matchScore: 0,
      distanceScore: 0,
      combinedScore: 0,
      canPartiallyFulfill: false,
      canFullyFulfill: false,
    }));

    return res.json({ 
      requestId: request._id,
      requestLocation: request.location,
      totalMatches: ngosWithDefaults.length,
      organizations: ngosWithDefaults,
      warning: "Request has no valid location coordinates. Showing all eligible NGOs."
    });
  }

  const options = {};
  if (maxDistance) options.maxDistance = parseInt(maxDistance);
  if (limit) options.limit = parseInt(limit);

  const matchedNGOs = await GeospatialService.findMatchingNGOs(request, options);

  res.json({ 
    requestId: request._id,
    requestLocation: request.location,
    totalMatches: matchedNGOs.length,
    organizations: matchedNGOs 
  });
});

module.exports = {
  createOrganization,
  listOrganizations,
  verifyOrganization,
  listPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  deleteOrganization,
  exportIncidents,
  suspendOrganization,
  unsuspendOrganization,
  updateMyResources,
  getMyOrganization,
  getMatchedNGOsForRequest,
};
