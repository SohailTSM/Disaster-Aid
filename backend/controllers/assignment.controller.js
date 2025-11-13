const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignment.model");
const AssignmentService = require("../services/assignment.service");
const Organization = require("../models/organization.model");

// POST /api/assignments (dispatcher)
const createAssignment = asyncHandler(async (req, res) => {
  const { requestId, organizationId, assignedNeeds, notes } = req.body;
  const dispatcherId = req.user._id;

  if (!assignedNeeds || assignedNeeds.length === 0) {
    res.status(400);
    throw new Error("Please specify which needs to assign");
  }

  const assignment = await AssignmentService.createAssignment(
    requestId,
    organizationId,
    dispatcherId,
    assignedNeeds,
    notes
  );
  res.status(201).json({ assignment });
});

// GET /api/assignments
const listAssignments = asyncHandler(async (req, res) => {
  const { organizationId, status } = req.query;
  const filter = {};
  if (organizationId) filter.organizationId = organizationId;
  if (status) filter.status = status;
  const assignments = await Assignment.find(filter)
    .populate("requestId organizationId dispatcherId")
    .sort({ createdAt: -1 });
  res.json({ assignments });
});

// GET /api/assignments/my (ngo_member)
const myAssignments = asyncHandler(async (req, res) => {
  if (!req.user.organizationId) {
    res.status(400);
    throw new Error("User has no organization");
  }
  const assignments = await Assignment.find({
    organizationId: req.user.organizationId,
  })
    .populate("requestId")
    .populate("dispatcherId", "name email")
    .sort({ createdAt: -1 });
  res.json({ assignments });
});

// PUT /api/assignments/:id/accept (ngo_member) - Accept assignment
const acceptAssignment = asyncHandler(async (req, res) => {
  const { isPartialAcceptance, acceptedNeeds } = req.body;
  const assignment = await Assignment.findById(req.params.id).populate(
    "requestId"
  );

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  // Verify user belongs to the assigned organization
  if (
    assignment.organizationId.toString() !== req.user.organizationId.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to accept this assignment");
  }

  if (assignment.status !== "Pending") {
    res.status(400);
    throw new Error("Assignment already processed");
  }

  assignment.status = "Accepted";
  assignment.acceptedAt = new Date();
  assignment.isPartialAcceptance = isPartialAcceptance || false;

  if (isPartialAcceptance && acceptedNeeds && acceptedNeeds.length > 0) {
    assignment.acceptedNeeds = acceptedNeeds;
  }

  await assignment.save();
  res.json({ message: "Assignment accepted", assignment });
});

// PUT /api/assignments/:id/decline (ngo_member) - Decline assignment
const declineAssignment = asyncHandler(async (req, res) => {
  const { declineReason } = req.body;
  const assignment = await Assignment.findById(req.params.id).populate(
    "requestId"
  );

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  // Verify user belongs to the assigned organization
  if (
    assignment.organizationId.toString() !== req.user.organizationId.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to decline this assignment");
  }

  if (assignment.status !== "Pending") {
    res.status(400);
    throw new Error("Assignment already processed");
  }

  assignment.status = "Declined";
  assignment.declinedAt = new Date();
  assignment.declineReason = declineReason || "";

  await assignment.save();

  // Mark the assigned needs as declined in the request so dispatcher can reassign
  const Request = require("../models/request.model");
  const request = await Request.findById(assignment.requestId._id);
  if (request) {
    assignment.assignedNeeds.forEach((needType) => {
      const needIndex = request.needs.findIndex((n) => n.type === needType);
      if (needIndex !== -1) {
        request.needs[needIndex].assignmentStatus = "declined";
        request.needs[needIndex].assignedTo = null;
        request.needs[needIndex].assignmentId = null;
      }
    });
    await request.save();
  }

  res.json({ message: "Assignment declined", assignment });
});

// PUT /api/assignments/:id/status (ngo_member) - Update assignment progress
const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { status, deliveryDetails, completionProof, notes } = req.body;
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  // Verify user belongs to the assigned organization
  if (
    assignment.organizationId.toString() !== req.user.organizationId.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to update this assignment");
  }

  // Validate status transitions
  const validStatuses = ["Processing", "In-Transit", "Completed"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  // For In-Transit, require delivery details
  if (status === "In-Transit" && !deliveryDetails) {
    res.status(400);
    throw new Error("Delivery details required for In-Transit status");
  }

  // For Completed, completion proof is optional for now (image upload to be implemented later)
  // if (status === "Completed" && !completionProof?.imageUrl) {
  //   res.status(400);
  //   throw new Error("Completion proof image required for Completed status");
  // }

  assignment.status = status;
  if (notes) assignment.notes = notes;

  if (deliveryDetails) {
    assignment.deliveryDetails = deliveryDetails;
  }

  if (completionProof) {
    assignment.completionProof = {
      ...completionProof,
      completedAt: new Date(),
    };
  }

  await assignment.save();
  res.json({ message: "Assignment status updated", assignment });
});

// PUT /api/assignments/:id (update status or notes) - Keep for backward compatibility
const updateAssignment = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (status) assignment.status = status;
  if (notes) assignment.notes = notes;
  await assignment.save();
  res.json({ message: "Assignment updated", assignment });
});

module.exports = {
  createAssignment,
  listAssignments,
  myAssignments,
  updateAssignment,
  acceptAssignment,
  declineAssignment,
  updateAssignmentStatus,
};
