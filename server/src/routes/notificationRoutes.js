const express = require("express");
const { getNotifications, markAllRead } = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.patch("/read", verifyToken, markAllRead);

module.exports = router;
