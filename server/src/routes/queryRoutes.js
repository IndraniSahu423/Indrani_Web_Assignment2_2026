const express = require("express");

const queryController = require("../controllers/queryController");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, queryController.getAllQueries);
router.post("/", verifyToken, queryController.createQuery);
router.get("/:id", verifyToken, queryController.getQueryById);
router.put("/:id", verifyToken, queryController.updateQuery);
router.patch("/:id", verifyToken, queryController.updateQuery);
router.delete("/:id", verifyToken, requireRole("superadmin"), queryController.deleteQuery);

module.exports = router;

