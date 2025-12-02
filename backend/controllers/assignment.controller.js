const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignment.model");
const AssignmentService = require("../services/assignment.service");
const Organization = require("../models/organization.model");
const { uploadFile, getSignedDownloadUrl } = require("../services/s3.service");
const {
  notifyVictim,
  generateNotificationMessage,
} = require("../services/messaging.service");

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

  // Send notification to victim about assignment
  try {
    const Request = require("../models/request.model");
    const request = await Request.findById(requestId);
    const org = await Organization.findById(organizationId);

    if (request && org) {
      const message = generateNotificationMessage(request, "assigned", {
        organizationName: org.name,
        needTypes: assignedNeeds,
      });
      await notifyVictim(request, message);
    }
  } catch (error) {
    console.error("Failed to send assignment notification:", error);
  }

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

  // Generate signed URLs for completion proof images and request evidence
  const assignmentsWithUrls = await Promise.all(
    assignments.map(async (assignment) => {
      const assignmentObj = assignment.toObject();

      // Generate signed URL for completion proof
      if (assignment.completionProof?.s3Key) {
        assignmentObj.completionProof.imageUrl = await getSignedDownloadUrl(
          assignment.completionProof.s3Key
        );
      }

      // Generate signed URLs for request evidence
      if (
        assignment.requestId?.evidence &&
        assignment.requestId.evidence.length > 0
      ) {
        assignmentObj.requestId.evidence = await Promise.all(
          assignment.requestId.evidence.map(async (img) => ({
            s3Key: img.s3Key,
            originalName: img.originalName,
            uploadedAt: img.uploadedAt,
            url: await getSignedDownloadUrl(img.s3Key),
          }))
        );
      }

      return assignmentObj;
    })
  );

  res.json({ assignments: assignmentsWithUrls });
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

  // Notify victim that organization accepted the assignment
  try {
    const Request = require("../models/request.model");
    const request = await Request.findById(
      assignment.requestId._id || assignment.requestId
    );
    const org = await Organization.findById(assignment.organizationId);

    if (request && org) {
      const message = generateNotificationMessage(
        request,
        "assignment_accepted",
        {
          organizationName: org.name,
        }
      );
      await notifyVictim(request, message);
    }
  } catch (error) {
    console.error("Failed to send acceptance notification:", error);
  }

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

  // Restore NGO offers when assignment is declined
  const org = await Organization.findById(assignment.organizationId);
  if (org && request) {
    assignment.assignedNeeds.forEach((needType) => {
      const need = request.needs.find((n) => n.type === needType);
      if (need) {
        const offerIndex = org.offers.findIndex((o) => o.type === needType);
        if (offerIndex !== -1) {
          org.offers[offerIndex].quantity += need.quantity;
        }
      }
    });
    await org.save();
  }

  // Notify victim that assignment was declined (being reassigned)
  try {
    if (request) {
      const message = generateNotificationMessage(
        request,
        "assignment_declined"
      );
      await notifyVictim(request, message);
    }
  } catch (error) {
    console.error("Failed to send decline notification:", error);
  }

  res.json({ message: "Assignment declined", assignment });
});

// PUT /api/assignments/:id/status (ngo_member) - Update assignment progress
const updateAssignmentStatus = asyncHandler(async (req, res) => {
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

  // Parse data from form-data (if multipart) or regular JSON
  let requestData;
  if (req.body.data) {
    requestData =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;
  } else {
    requestData = req.body;
  }

  const { status, deliveryDetails, completionNotes, notes } = requestData;

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

  // Handle image upload for Completed status
  if (status === "Completed") {
    if (req.file) {
      // Upload image to S3
      const uploadedFile = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "deliveries"
      );
      assignment.completionProof = {
        s3Key: uploadedFile.key,
        originalName: uploadedFile.originalName,
        uploadedAt: new Date(),
        completedAt: new Date(),
        completionNotes: completionNotes || "",
      };
    } else {
      // Allow completion without image (optional)
      assignment.completionProof = {
        completedAt: new Date(),
        completionNotes: completionNotes || "",
      };
    }
  }

  assignment.status = status;
  if (notes) assignment.notes = notes;

  if (deliveryDetails) {
    assignment.deliveryDetails = deliveryDetails;
  }

  await assignment.save();

  // Update request status and individual need statuses when assignment is completed
  if (status === "Completed") {
    const Request = require("../models/request.model");
    const request = await Request.findById(assignment.requestId);

    if (request) {
      // Mark individual needs as completed for this assignment
      assignment.assignedNeeds.forEach((needType) => {
        const needIndex = request.needs.findIndex(
          (n) =>
            n.type === needType &&
            n.assignmentId &&
            n.assignmentId.toString() === assignment._id.toString()
        );

        if (needIndex !== -1) {
          request.needs[needIndex].assignmentStatus = "completed";
        }
      });

      // Get all assignments for this request
      const allAssignments = await Assignment.find({
        requestId: assignment.requestId,
      });

      // Count total assigned needs and completed needs
      const totalAssignedNeeds = request.needs.filter(
        (need) =>
          need.assignmentStatus === "assigned" ||
          need.assignmentStatus === "completed"
      ).length;

      const completedAssignments = allAssignments.filter(
        (a) => a.status === "Completed"
      );

      // Count how many needs are fulfilled by completed assignments
      let completedNeedsCount = 0;
      completedAssignments.forEach((completedAssignment) => {
        completedAssignment.assignedNeeds.forEach((needType) => {
          const needExists = request.needs.some(
            (n) =>
              n.type === needType &&
              (n.assignmentStatus === "assigned" ||
                n.assignmentStatus === "completed")
          );
          if (needExists) {
            completedNeedsCount++;
          }
        });
      });

      // Update request status based on completion
      if (completedNeedsCount >= totalAssignedNeeds && totalAssignedNeeds > 0) {
        // All assigned needs are fulfilled
        request.status = "Closed";
      } else if (completedNeedsCount > 0) {
        // Some needs are fulfilled
        request.status = "In-Progress";
      }

      await request.save();

      // Notify victim based on status change
      try {
        let updateType = null;
        let notificationDetails = {};

        if (status === "In-Transit") {
          updateType = "delivery_started";
          // Include delivery details in the notification
          if (assignment.deliveryDetails) {
            notificationDetails.deliveryDetails = assignment.deliveryDetails;
          }
        } else if (status === "Completed") {
          // Check if all needs are completed
          const allCompleted = request.needs.every(
            (n) =>
              n.assignmentStatus === "completed" ||
              n.assignmentStatus === "unassigned"
          );
          updateType = allCompleted ? "completed" : "in_progress";
        }

        if (updateType) {
          const message = generateNotificationMessage(
            request,
            updateType,
            notificationDetails
          );
          await notifyVictim(request, message);
        }
      } catch (error) {
        console.error("Failed to send status update notification:", error);
      }
    }
  }

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

// GET /api/assignments/request/:requestId - Get assignments for a specific request
const getAssignmentsByRequest = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({
    requestId: req.params.requestId,
  })
    .populate("organizationId", "name contact email")
    .populate("dispatcherId", "name email")
    .sort({ createdAt: -1 });

  // Generate signed URLs for completion proof images
  const assignmentsWithUrls = await Promise.all(
    assignments.map(async (assignment) => {
      const assignmentObj = assignment.toObject();
      if (assignment.completionProof?.s3Key) {
        assignmentObj.completionProof.imageUrl = await getSignedDownloadUrl(
          assignment.completionProof.s3Key
        );
      }
      return assignmentObj;
    })
  );

  res.json({ assignments: assignmentsWithUrls });
});

module.exports = {
  createAssignment,
  listAssignments,
  myAssignments,
  updateAssignment,
  acceptAssignment,
  declineAssignment,
  updateAssignmentStatus,
  getAssignmentsByRequest,
};
