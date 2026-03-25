const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 2 }).withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password")
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
    // Domain is now assigned by admins in DB; we default to the first domain if omitted.
    body("domainId").optional().isInt().withMessage("domainId must be an integer."),
  ],
  handleValidationErrors,
  authController.register
);

router.post(
  "/send-otp",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").isString().notEmpty().withMessage("Password is required."),
  ],
  handleValidationErrors,
  authController.sendOtp
);

router.post(
  "/verify-otp",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("otp").isString().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits."),
  ],
  handleValidationErrors,
  authController.verifyOtp
);

router.get("/me", verifyToken, authController.getMe);

module.exports = router;

