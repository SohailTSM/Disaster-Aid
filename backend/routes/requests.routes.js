const express = require("express");
const router = express.Router();
const {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  getRequestByRequestId,
  updateNeed,
  deleteNeed,
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

// Need-level operations
router.put(
  "/:requestId/needs/:needIndex",
  auth,
  allowedRoles("dispatcher", "admin"),
  updateNeed
);
router.delete(
  "/:requestId/needs/:needIndex",
  auth,
  allowedRoles("dispatcher", "admin"),
  deleteNeed
);

module.exports = router;
