const asyncHandler = require("express-async-handler");
const Request = require("../models/request.model");
const requestService = require("../services/request.service");

// POST /api/requests (public)
const createRequest = asyncHandler(async (req, res) => {
  const created = await requestService.createRequest(req.body);
  res.status(201).json({
    request: created,
    requestId: created.requestId,
    message: `Request submitted successfully. Your Request ID is ${created.requestId}. Please save this for future reference.`,
  });
});

// GET /api/requests (protected - dispatcher/authority)
const listRequests = asyncHandler(async (req, res) => {
  const { status, priority, isSoS } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (isSoS !== undefined) filter.isSoS = isSoS === "true";
  const requests = await Request.find(filter).sort({ createdAt: -1 });
  res.json({ requests });
});

// GET /api/requests/:id (protected)
const getRequest = asyncHandler(async (req, res) => {
  const reqDoc = await Request.findById(req.params.id).populate(
    "needs.assignedTo",
    "name contact email"
  );
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }
  res.json({ request: reqDoc });
});

// PUT /api/requests/:id (dispatcher)
const updateRequest = asyncHandler(async (req, res) => {
  const { status, notes, needs } = req.body;
  const reqDoc = await Request.findById(req.params.id);
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }
  if (status) reqDoc.status = status;
  if (notes) reqDoc.notes = notes;
  if (needs) reqDoc.needs = needs;
  await reqDoc.save();
  res.json({ message: "Request updated", request: reqDoc });
});

// GET /api/requests/by-requestid/:requestId (public)
const RequestComponent = require("../models/requestComponent.model");
const getRequestByRequestId = asyncHandler(async (req, res) => {
  const reqDoc = await Request.findOne({
    requestId: Number(req.params.requestId),
  });
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }
  // Find all components for this request
  const components = await RequestComponent.find({ requestId: reqDoc._id });
  res.json({ request: reqDoc, components });
});

// PUT /api/requests/:requestId/needs/:needIndex - Update a specific need
const updateNeed = asyncHandler(async (req, res) => {
  const { requestId, needIndex } = req.params;
  const { type, quantity } = req.body;

  const reqDoc = await Request.findById(requestId);
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }

  const index = parseInt(needIndex);
  if (isNaN(index) || index < 0 || index >= reqDoc.needs.length) {
    res.status(400);
    throw new Error("Invalid need index");
  }

  // Check if the need is already assigned
  if (reqDoc.needs[index].assignmentStatus === "assigned") {
    res.status(400);
    throw new Error(
      "Cannot edit this need as it has already been assigned to an NGO"
    );
  }

  // Update the need
  if (type) reqDoc.needs[index].type = type;
  if (quantity) reqDoc.needs[index].quantity = quantity;

  await reqDoc.save();
  res.json({ message: "Need updated successfully", request: reqDoc });
});

// DELETE /api/requests/:requestId/needs/:needIndex - Delete a specific need
const deleteNeed = asyncHandler(async (req, res) => {
  const { requestId, needIndex } = req.params;

  const reqDoc = await Request.findById(requestId);
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }

  const index = parseInt(needIndex);
  if (isNaN(index) || index < 0 || index >= reqDoc.needs.length) {
    res.status(400);
    throw new Error("Invalid need index");
  }

  // Check if the need is already assigned
  if (reqDoc.needs[index].assignmentStatus === "assigned") {
    res.status(400);
    throw new Error(
      "Cannot delete this need as it has already been assigned to an NGO"
    );
  }

  // Ensure at least one need remains
  if (reqDoc.needs.length === 1) {
    res.status(400);
    throw new Error("Cannot delete the last remaining need from the request");
  }

  // Remove the need
  reqDoc.needs.splice(index, 1);
  await reqDoc.save();

  res.json({ message: "Need deleted successfully", request: reqDoc });
});

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  getRequestByRequestId,
  updateNeed,
  deleteNeed,
};
