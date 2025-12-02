const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const assignmentSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  dispatcherId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // Track which specific needs this assignment is for
  assignedNeeds: [
    {
      type: String,
      required: true,
    },
  ],

  status: {
    type: String,
    enum: [
      "Pending",
      "Accepted",
      "Declined",
      "Processing",
      "In-Transit",
      "Completed",
    ],
    default: "Pending",
  },
  notes: { type: String },

  // Acceptance/Decline
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  declineReason: { type: String },
  isPartialAcceptance: { type: Boolean, default: false },
  acceptedNeedsList: [{ type: String }], // Array of need types that are accepted (subset of assignedNeeds)

  // Delivery details for In-Transit
  deliveryDetails: {
    estimatedDeliveryTime: { type: Date },
    vehicleNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    additionalNotes: { type: String },
  },

  // Completion proof
  completionProof: {
    s3Key: { type: String }, // S3 object key
    originalName: { type: String }, // Original filename
    uploadedAt: { type: Date },
    completedAt: { type: Date },
    completionNotes: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp before saving
assignmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Assignment", assignmentSchema);
