const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const organizationSchema = new Schema({
  name: { type: String, required: true },
  headName: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  offers: [
    {
      type: {
        type: String,
        enum: [
          "rescue",
          "food",
          "water",
          "medical",
          "shelter",
          "baby_supplies",
          "sanitation",
          "transport",
          "power_charging",
        ],
        required: true,
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  approved: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  suspensionMetadata: {
    suspendedBy: { type: Schema.Types.ObjectId, ref: "User" },
    suspendedAt: { type: Date },
    suspensionReason: { type: String },
    unsuspendedAt: { type: Date },
  },
  approvalMetadata: {
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

organizationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Organization", organizationSchema);
