const Assignment = require('../models/assignment.model');
const Request = require('../models/request.model');

const createAssignment = async (requestId, organizationId, dispatcherId, notes = '') => {
  const reqDoc = await Request.findById(requestId);
  if (!reqDoc) {
    const e = new Error('Request not found');
    e.status = 404;
    throw e;
  }

  // check if already assigned (basic)
  const existing = await Assignment.findOne({ requestId, status: { $in: ['New', 'In-Progress'] }});
  if (existing) {
    const e = new Error('Request already assigned');
    e.status = 400;
    throw e;
  }

  const ass = new Assignment({ requestId, organizationId, dispatcherId, notes, status: 'New' });
  await ass.save();

  reqDoc.status = 'In-Progress';
  await reqDoc.save();

  return ass;
};

const updateAssignmentStatus = async (assignmentId, newStatus, userId) => {
  if (!['New', 'In-Progress', 'Closed'].includes(newStatus)) {
    const e = new Error('Invalid status');
    e.status = 400;
    throw e;
  }

  const ass = await Assignment.findById(assignmentId).populate('requestId');
  if (!ass) {
    const e = new Error('Assignment not found');
    e.status = 404;
    throw e;
  }

  // user must be part of assigned organization or admin - here check whether userId equals dispatcher or assume caller checks role earlier
  // We'll ensure caller is from same organization in controller middleware (caller is NGO member)
  ass.status = newStatus;
  if (newStatus === 'Closed') ass.closedAt = new Date();
  await ass.save();

  // cascade to request
  if (newStatus === 'Closed' && ass.requestId) {
    const reqDoc = await Request.findById(ass.requestId._id);
    if (reqDoc) {
      reqDoc.status = 'Closed';
      await reqDoc.save();
    }
  }

  return ass;
};

module.exports = { createAssignment, updateAssignmentStatus };
