const mongoose = require("mongoose");

const advisorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    active: {
      type: Boolean,
      default: true,
    },
    authorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Advisory", advisorySchema);
