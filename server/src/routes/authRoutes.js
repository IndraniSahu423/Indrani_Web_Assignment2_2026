const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

router.post(
  "/register-send-otp",
  [
    body("name").isString().trim().isLength({ min: 2 }).withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").isString().isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  handleValidationErrors,
  authController.registerSendOtp
);

router.post(
  "/register-verify-otp",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("otp").isString().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits."),
  ],
  handleValidationErrors,
  authController.registerVerifyOtp
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").isString().notEmpty().withMessage("Password is required."),
  ],
  handleValidationErrors,
  authController.login
);

router.get("/me", verifyToken, authController.getMe);

module.exports = router;
