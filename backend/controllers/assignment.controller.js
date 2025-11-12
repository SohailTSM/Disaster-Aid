const asyncHandler = require('express-async-handler');
const Assignment = require('../models/assignment.model');
const AssignmentService = require('../services/assignment.service');

// POST /api/assignments (dispatcher)
const createAssignment = asyncHandler(async (req, res) => {
  const { requestId, organizationId, notes } = req.body;
  const dispatcherId = req.user._id;
  const assignment = await AssignmentService.createAssignment(requestId, organizationId, dispatcherId, notes);
  res.status(201).json({ assignment });
});

// GET /api/assignments
const listAssignments = asyncHandler(async (req, res) => {
  const { organizationId, status } = req.query;
  const filter = {};
  if (organizationId) filter.organizationId = organizationId;
  if (status) filter.status = status;
  const assignments = await Assignment.find(filter).populate('requestId organizationId dispatcherId').sort({ createdAt: -1 });
  res.json({ assignments });
});

// GET /api/assignments/my (ngo_member)
const myAssignments = asyncHandler(async (req, res) => {
  if (!req.user.organizationId) {
    res.status(400);
    throw new Error('User has no organization');
  }
  const assignments = await Assignment.find({ organizationId: req.user.organizationId }).populate('requestId').sort({ createdAt: -1 });
  res.json({ assignments });
});

// PUT /api/assignments/:id (update status or notes)
const updateAssignment = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  if (status) assignment.status = status;
  if (notes) assignment.notes = notes;
  if (status === 'Closed') assignment.closedAt = new Date();
  await assignment.save();
  res.json({ message: 'Assignment updated', assignment });
});

module.exports = { createAssignment, listAssignments, myAssignments, updateAssignment };
