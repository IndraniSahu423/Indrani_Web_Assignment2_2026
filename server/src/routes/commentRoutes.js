const express = require("express");

const commentController = require("../controllers/commentController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/:id/comments", verifyToken, commentController.addComment);
router.get("/:id/comments", verifyToken, commentController.getComments);

module.exports = router;

