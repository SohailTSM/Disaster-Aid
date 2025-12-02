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

/**
 * Auto-triage: Calculate priority based on multiple factors
 * @param {object} data - Request data
 * @returns {string} - Priority level (low, medium, high, sos)
 */
const calculatePriority = (data) => {
  const priorities = ["low", "medium", "high", "sos"];
  let calculatedPriority = "low";

  // Rule 1: Total number of victims
  const totalVictims =
    (data.beneficiaries_adults || 0) +
    (data.beneficiaries_children || 0) +
    (data.beneficiaries_elderly || 0);

  if (totalVictims > 20) {
    calculatedPriority = "sos";
  } else if (totalVictims > 10) {
    calculatedPriority = "high";
  } else if (totalVictims > 5) {
    calculatedPriority = "medium";
  }

  // Rule 2: Vulnerable populations (children + elderly)
  const vulnerableCount =
    (data.beneficiaries_children || 0) + (data.beneficiaries_elderly || 0);

  let vulnerablePriority = "low";
  if (vulnerableCount > 10) {
    vulnerablePriority = "sos";
  } else if (vulnerableCount > 5) {
    vulnerablePriority = "high";
  } else if (vulnerableCount > 3) {
    vulnerablePriority = "medium";
  }

  // Select highest priority between total victims and vulnerable count
  if (
    priorities.indexOf(vulnerablePriority) >
    priorities.indexOf(calculatedPriority)
  ) {
    calculatedPriority = vulnerablePriority;
  }

  // Rule 3: Emergency keywords in special needs or address
  const text = data.specialNeeds || "";

  const emergencyKeywords = [
    "trapped",
    "drowned",
    "emergency",
    "dead",
    "sos",
    "trap",
    "drown",
    "crushed",
    "urgent",
    "immediately",
    "help",
  ];
  const hasEmergencyKeyword = emergencyKeywords.some((keyword) =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasEmergencyKeyword) {
    calculatedPriority = "sos";
  }

  return calculatedPriority;
};

const createRequest = async (data) => {
  // minimal validation
  if (!data.contactName || !data.contactPhone || !data.location) {
    const err = new Error("Missing contact or location");
    err.status = 400;
    throw err;
  }

  validateLocation(data.location);

  // Auto-triage: Calculate priority based on multiple factors
  const calculatedPriority = calculatePriority(data);
  const isSoS = calculatedPriority === "sos";

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
    priority: calculatedPriority,
    status: "Triaged", // Auto-set status to Triaged after auto-triaging
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
