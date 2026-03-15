const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const { createUser, getAllUsers, deactivateUser, resetPassword, getCoordinators, getStats } = require("../controllers/userController");

const router = express.Router();

router.post("/", verifyToken, requireRole("superadmin", "admin"), createUser);
router.get("/", verifyToken, requireRole("superadmin", "admin"), getAllUsers);
router.get("/coordinators", verifyToken, requireRole("superadmin", "admin"), getCoordinators);
router.get("/stats", verifyToken, requireRole("superadmin", "admin"), getStats);
router.patch("/:id/deactivate", verifyToken, requireRole("superadmin", "admin"), deactivateUser);
router.patch("/:id/reset-password", verifyToken, requireRole("superadmin", "admin"), resetPassword);

module.exports = router;
