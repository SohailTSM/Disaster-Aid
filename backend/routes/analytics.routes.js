const express = require("express");
const router = express.Router();
const {
  getCrisisLoadDashboard,
  getResourceTrend,
} = require("../controllers/analytics.controller");
const auth = require("../middleware/auth.middleware");
const allowedRoles = require("../middleware/roles.middleware");

// Analytics routes - for authority and admin
router.get(
  "/crisis-load",
  auth,
  allowedRoles("authority", "admin"),
  getCrisisLoadDashboard
);

router.get(
  "/resource-trend",
  auth,
  allowedRoles("authority", "admin"),
  getResourceTrend
);

module.exports = router;
