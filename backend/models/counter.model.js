const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // name of the sequence (e.g., 'requestId')
  seq: { type: Number, default: 1000000 }, // start from 1000000 for 7 digits
});

module.exports = mongoose.model("Counter", counterSchema);
