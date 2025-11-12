const express = require("express");
const router = express.Router();
const {
  createOrganization,
  listOrganizations,
  verifyOrganization,
  listPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  deleteOrganization,
  exportIncidents,
} = require("../controllers/organization.controller");
const auth = require("../middleware/auth.middleware");
const allowedRoles = require("../middleware/roles.middleware");

// Admin routes for org approval and data management
router.get("/pending", auth, allowedRoles("admin"), listPendingOrganizations);
router.put("/:id/approve", auth, allowedRoles("admin"), approveOrganization);
router.put("/:id/reject", auth, allowedRoles("admin"), rejectOrganization);
router.delete("/:id", auth, allowedRoles("admin"), deleteOrganization);
router.get("/export/incidents", auth, allowedRoles("admin"), exportIncidents);

router.post("/", auth, allowedRoles("dispatcher", "admin"), createOrganization);
router.get(
  "/",
  auth,
  allowedRoles("dispatcher", "authority", "admin"),
  listOrganizations
);
router.put(
  "/:id/verify",
  auth,
  allowedRoles("dispatcher", "authority", "admin"),
  verifyOrganization
);

module.exports = router;
