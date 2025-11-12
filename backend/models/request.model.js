const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  requestId: { type: Number, required: true, unique: true, index: true }, // 7-digit auto-increment number
  status: {
    type: String,
    enum: ["New", "Triaged", "In-Progress", "Closed"],
    default: "New",
  },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  preferredCommunication: {
    type: String,
    enum: ["call", "sms"],
    default: "call",
  },
  language: { type: String },
  location: {
    type: { type: String, enum: ["Point", "Polygon"], default: "Point" },
    coordinates: { type: [], required: true }, // [lng, lat] or polygon coordinates
  },
  addressText: { type: String },
  needs: [
    { type: String, enum: ["rescue", "food", "water", "medical", "shelter"] },
  ],
  beneficiaries_adults: { type: Number, default: 0 },
  beneficiaries_children: { type: Number, default: 0 },
  beneficiaries_elderly: { type: Number, default: 0 },
  specialNeeds: { type: String },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "sos"],
    default: "low",
  },
  isSoS: { type: Boolean, default: false },
  source: {
    type: String,
    enum: ["web_form", "call_center"],
    default: "web_form",
  },
  createdAt: { type: Date, default: Date.now },
});

requestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Request", requestSchema);
