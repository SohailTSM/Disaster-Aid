const express = require("express");
const router = express.Router();
const {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  getRequestByRequestId,
} = require("../controllers/request.controller");
const auth = require("../middleware/auth.middleware");
const allowedRoles = require("../middleware/roles.middleware");

// Public endpoint for victims to check request status/details by requestId
router.get("/by-requestid/:requestId", getRequestByRequestId);

router.post("/", createRequest);
router.get(
  "/",
  auth,
  allowedRoles("dispatcher", "authority", "admin"),
  listRequests
);
router.get(
  "/:id",
  auth,
  allowedRoles("dispatcher", "authority", "admin"),
  getRequest
);
router.put(
  "/:id",
  auth,
  allowedRoles("dispatcher", "authority", "admin"),
  updateRequest
);

module.exports = router;
