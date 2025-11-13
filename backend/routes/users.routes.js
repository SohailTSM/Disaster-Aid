const express = require("express");
const router = express.Router();
const {
  createDispatcher,
  createAuthority,
  listDispatchers,
  listAuthorities,
  suspendUser,
  unsuspendUser,
  deleteUser,
} = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");
const allowedRoles = require("../middleware/roles.middleware");

// All routes require admin role
router.post(
  "/create-dispatcher",
  auth,
  allowedRoles("admin"),
  createDispatcher
);
router.post("/create-authority", auth, allowedRoles("admin"), createAuthority);
router.get("/dispatchers", auth, allowedRoles("admin"), listDispatchers);
router.get("/authorities", auth, allowedRoles("admin"), listAuthorities);
router.put("/:id/suspend", auth, allowedRoles("admin"), suspendUser);
router.put("/:id/unsuspend", auth, allowedRoles("admin"), unsuspendUser);
router.delete("/:id", auth, allowedRoles("admin"), deleteUser);

module.exports = router;
