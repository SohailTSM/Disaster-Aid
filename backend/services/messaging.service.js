const twilio = require("twilio");

// Initialize Twilio client lazily
let client = null;
const getClient = () => {
  if (
    !client &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  ) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return client;
};

/**
 * Send SMS notification to victim
 * @param {string} phone - Phone number in E.164 format (e.g., +919876543210)
 * @param {string} message - Message content
 * @returns {Promise<object>} - Twilio message response
 */
const sendSMS = async (phone, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn("Twilio credentials not configured. Skipping SMS.");
      console.log(
        "Debug - Account SID:",
        process.env.TWILIO_ACCOUNT_SID ? "Set" : "Not set"
      );
      console.log(
        "Debug - Auth Token:",
        process.env.TWILIO_AUTH_TOKEN ? "Set" : "Not set"
      );
      return { status: "skipped", reason: "Twilio not configured" };
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn("Twilio phone number not configured. Skipping SMS.");
      return { status: "skipped", reason: "Twilio phone not configured" };
    }

    // Ensure phone number is in E.164 format
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    const twilioClient = getClient();
    if (!twilioClient) {
      console.error("Failed to initialize Twilio client");
      return { status: "failed", error: "Twilio client not initialized" };
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`SMS sent to ${formattedPhone}. SID: ${response.sid}`);
    return { status: "sent", sid: response.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { status: "failed", error: error.message };
  }
};

/**
 * Send WhatsApp message to victim
 * NOTE: For WhatsApp to work on Twilio:
 * - Testing: Recipient must join sandbox by sending "join <code>" to sandbox number
 * - Production: Requires business verification and approved message templates
 * @param {string} phone - Phone number in E.164 format (e.g., +919876543210)
 * @param {string} message - Message content
 * @returns {Promise<object>} - Twilio message response
 */
const sendWhatsApp = async (phone, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn("Twilio credentials not configured. Skipping WhatsApp.");
      return { status: "skipped", reason: "Twilio not configured" };
    }

    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      console.warn("Twilio WhatsApp number not configured. Skipping WhatsApp.");
      console.log(
        "To enable WhatsApp: Set up sandbox at https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
      );
      return { status: "skipped", reason: "Twilio WhatsApp not configured" };
    }

    // Ensure phone number is in E.164 format
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    const twilioClient = getClient();
    if (!twilioClient) {
      console.error("Failed to initialize Twilio client");
      return { status: "failed", error: "Twilio client not initialized" };
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
    });

    console.log(`WhatsApp sent to ${formattedPhone}. SID: ${response.sid}`);
    return { status: "sent", sid: response.sid };
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return { status: "failed", error: error.message };
  }
};

/**
 * Send notification via both SMS and WhatsApp
 * @param {object} request - Request document with contactPhone
 * @param {string} message - Message content
 * @returns {Promise<object>} - Notification result
 */
const notifyVictim = async (request, message) => {
  const phone = request.contactPhone;

  console.log(`Sending notification to ${phone} via SMS and WhatsApp`);

  const results = {
    sms: null,
    whatsapp: null,
  };

  // Send SMS
  results.sms = await sendSMS(phone, message);

  // Send WhatsApp (if configured)
  if (process.env.TWILIO_WHATSAPP_NUMBER) {
    results.whatsapp = await sendWhatsApp(phone, message);
  }

  // Return combined results
  const success =
    results.sms.status === "sent" || results.whatsapp?.status === "sent";

  return {
    status: success ? "sent" : "failed",
    sms: results.sms,
    whatsapp: results.whatsapp,
  };
};

/**
 * Generate notification message for request status updates
 * @param {object} request - Request document
 * @param {string} updateType - Type of update (created, assigned, in_progress, completed, closed)
 * @param {object} details - Additional details about the update
 * @returns {string} - Formatted notification message
 */
const generateNotificationMessage = (request, updateType, details = {}) => {
  const requestId = request.requestId;
  const name = request.contactName;

  switch (updateType) {
    case "created":
      return `Hi ${name}, your disaster aid request #${requestId} has been received. Our team will review it shortly. Track status: ${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/track-status`;

    case "triaged":
      return `Request #${requestId} has been reviewed and prioritized. Our dispatchers are assigning relief organizations to help you.`;

    case "assigned":
      const orgName = details.organizationName || "a relief organization";
      const needTypes = details.needTypes || [];
      const needsText =
        needTypes.length > 0 ? ` for ${needTypes.join(", ")}` : "";
      return `Good news! ${orgName} has been assigned to your request #${requestId}${needsText}. Help is on the way!`;

    case "in_progress":
      return `Your request #${requestId} is now in progress. Relief organizations are working to fulfill your needs.`;

    case "completed":
      return `Great news! Your request #${requestId} has been completed. We hope you received the assistance you needed. Stay safe!`;

    case "closed":
      return `Your request #${requestId} has been closed. If you need further assistance, please submit a new request.`;

    case "assignment_accepted":
      const acceptedOrg = details.organizationName || "A relief organization";
      return `${acceptedOrg} has accepted your request #${requestId}. They will be delivering assistance soon.`;

    case "assignment_declined":
      return `We're working on reassigning your request #${requestId} to another organization. We'll keep you updated.`;

    case "delivery_started":
      let deliveryMsg = `Your aid delivery for request #${requestId} is now in transit. Help is on the way!`;

      if (details.deliveryDetails) {
        const dd = details.deliveryDetails;
        const deliveryInfo = [];

        if (dd.driverName) deliveryInfo.push(`Driver: ${dd.driverName}`);
        if (dd.driverPhone) deliveryInfo.push(`Contact: ${dd.driverPhone}`);
        if (dd.vehicleNumber) deliveryInfo.push(`Vehicle: ${dd.vehicleNumber}`);
        if (dd.estimatedDeliveryTime) {
          const eta = new Date(dd.estimatedDeliveryTime);
          deliveryInfo.push(
            `ETA: ${eta.toLocaleString("en-IN", {
              dateStyle: "short",
              timeStyle: "short",
            })}`
          );
        }

        if (deliveryInfo.length > 0) {
          deliveryMsg += `\n\n${deliveryInfo.join("\n")}`;
        }

        if (dd.additionalNotes) {
          deliveryMsg += `\n\nNote: ${dd.additionalNotes}`;
        }
      }

      return deliveryMsg;

    default:
      return `Update on your request #${requestId}: Status has been updated. Track it here: ${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/track-status`;
  }
};

module.exports = {
  sendSMS,
  sendWhatsApp,
  notifyVictim,
  generateNotificationMessage,
};
