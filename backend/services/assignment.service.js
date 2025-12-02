const Assignment = require("../models/assignment.model");
const Request = require("../models/request.model");

const createAssignment = async (
  requestId,
  organizationId,
  dispatcherId,
  assignedNeeds = [],
  notes = ""
) => {
  const reqDoc = await Request.findById(requestId);
  if (!reqDoc) {
    const e = new Error("Request not found");
    e.status = 404;
    throw e;
  }

  // Validate that assignedNeeds are part of the request
  if (assignedNeeds.length === 0) {
    const e = new Error("No needs specified for assignment");
    e.status = 400;
    throw e;
  }

  const requestNeedTypes = reqDoc.needs.map((n) => n.type);
  const invalidNeeds = assignedNeeds.filter(
    (needType) => !requestNeedTypes.includes(needType)
  );
  if (invalidNeeds.length > 0) {
    const e = new Error(`Invalid need types: ${invalidNeeds.join(", ")}`);
    e.status = 400;
    throw e;
  }

  // Check if any of these needs are already assigned
  const alreadyAssigned = reqDoc.needs.filter(
    (need) =>
      assignedNeeds.includes(need.type) && need.assignmentStatus === "assigned"
  );
  if (alreadyAssigned.length > 0) {
    const e = new Error(
      `Some needs are already assigned: ${alreadyAssigned
        .map((n) => n.type)
        .join(", ")}`
    );
    e.status = 400;
    throw e;
  }

  // Check if there's an existing assignment for this request and organization
  const existingAssignment = await Assignment.findOne({
    requestId,
    organizationId,
    status: { $in: ["Pending", "Accepted", "Processing", "In-Transit"] }, // Active statuses
  });

  let ass;
  if (existingAssignment) {
    // Club the new needs to the existing assignment
    const combinedNeeds = [
      ...new Set([...existingAssignment.assignedNeeds, ...assignedNeeds]),
    ];
    existingAssignment.assignedNeeds = combinedNeeds;
    existingAssignment.notes = notes
      ? `${existingAssignment.notes}\n${notes}`
      : existingAssignment.notes;
    await existingAssignment.save();
    ass = existingAssignment;
  } else {
    // Create a new assignment
    ass = new Assignment({
      requestId,
      organizationId,
      dispatcherId,
      assignedNeeds,
      notes,
      status: "Pending",
    });
    await ass.save();
  }

  // Update the needs in the request to mark them as assigned
  assignedNeeds.forEach((needType) => {
    const needIndex = reqDoc.needs.findIndex((n) => n.type === needType);
    if (needIndex !== -1) {
      reqDoc.needs[needIndex].assignmentStatus = "assigned";
      reqDoc.needs[needIndex].assignedTo = organizationId;
      reqDoc.needs[needIndex].assignmentId = ass._id;
    }
  });

  // Update request status to In-Progress if it's New or Triaged
  if (reqDoc.status === "New" || reqDoc.status === "Triaged") {
    reqDoc.status = "In-Progress";
  }

  await reqDoc.save();

  // Decrease NGO offers when assignment is created
  const Organization = require("../models/organization.model");
  const org = await Organization.findById(organizationId);
  if (org) {
    assignedNeeds.forEach((needType) => {
      const need = reqDoc.needs.find((n) => n.type === needType);
      if (need) {
        const offerIndex = org.offers.findIndex((o) => o.type === needType);
        if (offerIndex !== -1) {
          org.offers[offerIndex].quantity = Math.max(
            0,
            org.offers[offerIndex].quantity - need.quantity
          );
        }
      }
    });
    await org.save();
  }

  return ass;
};

const updateAssignmentStatus = async (assignmentId, newStatus, userId) => {
  if (!["New", "In-Progress", "Closed"].includes(newStatus)) {
    const e = new Error("Invalid status");
    e.status = 400;
    throw e;
  }

  const ass = await Assignment.findById(assignmentId).populate("requestId");
  if (!ass) {
    const e = new Error("Assignment not found");
    e.status = 404;
    throw e;
  }

  // user must be part of assigned organization or admin - here check whether userId equals dispatcher or assume caller checks role earlier
  // We'll ensure caller is from same organization in controller middleware (caller is NGO member)
  ass.status = newStatus;
  if (newStatus === "Closed") ass.closedAt = new Date();
  await ass.save();

  // cascade to request
  if (newStatus === "Closed" && ass.requestId) {
    const reqDoc = await Request.findById(ass.requestId._id);
    if (reqDoc) {
      reqDoc.status = "Closed";
      await reqDoc.save();
    }
  }

  return ass;
};

module.exports = { createAssignment, updateAssignmentStatus };
