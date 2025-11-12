const asyncHandler = require("express-async-handler");
const Request = require("../models/request.model");
const requestService = require("../services/request.service");

// POST /api/requests (public)
const createRequest = asyncHandler(async (req, res) => {
  const created = await requestService.createRequest(req.body);
  res.status(201).json({ request: created });
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
  const reqDoc = await Request.findById(req.params.id);
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }
  res.json({ request: reqDoc });
});

// PUT /api/requests/:id (dispatcher)
const updateRequest = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const reqDoc = await Request.findById(req.params.id);
  if (!reqDoc) {
    res.status(404);
    throw new Error("Request not found");
  }
  if (status) reqDoc.status = status;
  if (notes) reqDoc.notes = notes;
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

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  getRequestByRequestId,
};
