const express = require("express");

const { getDomains } = require("../controllers/domainController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, getDomains);

module.exports = router;

