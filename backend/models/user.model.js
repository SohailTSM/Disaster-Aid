const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ["ngo_member", "authority", "dispatcher", "admin"],
    required: true,
  },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  suspended: { type: Boolean, default: false },
  suspensionMetadata: {
    suspendedBy: { type: Schema.Types.ObjectId, ref: "User" },
    suspendedAt: { type: Date },
    suspensionReason: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
