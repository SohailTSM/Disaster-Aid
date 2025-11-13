const asyncHandler = require("express-async-handler");
const Request = require("../models/request.model");
const RequestComponent = require("../models/requestComponent.model");
const Counter = require("../models/counter.model");

const validateLocation = (location) => {
  if (!location || !location.type || !Array.isArray(location.coordinates)) {
    throw new Error("Invalid location");
  }
  if (location.type === "Point" && location.coordinates.length !== 2) {
    throw new Error("Point coordinates must be [lng, lat]");
  }
};

const createRequest = async (data) => {
  // minimal validation
  if (!data.contactName || !data.contactPhone || !data.location) {
    const err = new Error("Missing contact or location");
    err.status = 400;
    throw err;
  }

  validateLocation(data.location);

  // Auto-triage: flag SOS if priority 'sos' or keyword present
  const text = (data.specialNeeds || "") + " " + (data.addressText || "");
  const sosKeywords = [
    "trapped",
    "injured",
    "help",
    "sos",
    "immediately",
    "urgent",
  ];
  const isSoS =
    data.priority === "sos" ||
    sosKeywords.some((k) => text.toLowerCase().includes(k));

  // Generate auto-increment 7-digit numeric requestId
  let counter = await Counter.findByIdAndUpdate(
    { _id: "requestId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const requestId = counter.seq;

  const reqDoc = new Request({
    ...data,
    requestId,
    isSoS,
    priority: data.priority || (isSoS ? "sos" : data.priority || "low"),
    status: "New",
  });

  await reqDoc.save();

  // Create RequestComponents for each need with quantity
  if (data.needs && Array.isArray(data.needs) && data.needs.length > 0) {
    const components = data.needs.map((need) => ({
      requestId: reqDoc._id,
      type: need.type,
      quantity: need.quantity,
      status: "New",
    }));
    await RequestComponent.insertMany(components);
  }

  return reqDoc;
};

module.exports = { createRequest };
