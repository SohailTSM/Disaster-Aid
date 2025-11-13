const express = require("express");
const router = express.Router();
const {
  createAssignment,
  listAssignments,
  myAssignments,
  updateAssignment,
  acceptAssignment,
  declineAssignment,
  updateAssignmentStatus,
} = require("../controllers/assignment.controller");
const auth = require("../middleware/auth.middleware");
const allowedRoles = require("../middleware/roles.middleware");

router.post(
  "/",
  auth,
  allowedRoles("dispatcher", "authority"),
  createAssignment
);
router.get(
  "/",
  auth,
  allowedRoles("dispatcher", "authority", "admin"),
  listAssignments
);
router.get("/my", auth, allowedRoles("ngo_member"), myAssignments);
router.put("/:id/accept", auth, allowedRoles("ngo_member"), acceptAssignment);
router.put("/:id/decline", auth, allowedRoles("ngo_member"), declineAssignment);
router.put(
  "/:id/status",
  auth,
  allowedRoles("ngo_member"),
  updateAssignmentStatus
);
router.put(
  "/:id",
  auth,
  allowedRoles("ngo_member", "dispatcher", "authority"),
  updateAssignment
);

module.exports = router;
