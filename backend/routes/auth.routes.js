const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  me,
  changePassword,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;
