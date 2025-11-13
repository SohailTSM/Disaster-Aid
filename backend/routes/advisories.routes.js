const express = require("express");
const router = express.Router();
const {
  getActiveAdvisories,
  getAllAdvisories,
  createAdvisory,
  updateAdvisory,
  deleteAdvisory,
  toggleAdvisoryStatus,
} = require("../controllers/advisory.controller");
const auth = require("../middleware/auth.middleware");
const allowedRoles = require("../middleware/roles.middleware");

// Public route - get active advisories
router.get("/", getActiveAdvisories);

// Protected routes - authority only
router.get("/all", auth, allowedRoles("authority", "admin"), getAllAdvisories);
router.post("/", auth, allowedRoles("authority", "admin"), createAdvisory);
router.put("/:id", auth, allowedRoles("authority", "admin"), updateAdvisory);
router.delete("/:id", auth, allowedRoles("authority", "admin"), deleteAdvisory);
router.put(
  "/:id/toggle",
  auth,
  allowedRoles("authority", "admin"),
  toggleAdvisoryStatus
);

module.exports = router;
