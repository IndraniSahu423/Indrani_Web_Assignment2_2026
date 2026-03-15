const express = require("express");

const uploadController = require("../controllers/uploadController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.post("/:id/upload", verifyToken, upload.single("file"), uploadController.uploadFile);

module.exports = router;

