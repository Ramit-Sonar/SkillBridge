import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  sendVerificationOtp,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginRateLimiter,
  otpSendRateLimiter,
  otpVerifyRateLimiter,
  passwordResetRateLimiter,
  registerRateLimiter,
} from "../middlewares/security.middleware.js";

const router = Router();
const authenticatedRoles = authorizeRoles("student", "client");
const currentUserRoles = authorizeRoles("student", "client", "admin");
const logoutRoles = authorizeRoles("student", "client", "admin");

// Public authentication and recovery routes.
router.route("/register").post(registerRateLimiter, registerUser);

router.route("/login").post(loginRateLimiter, loginUser);

router
  .route("/send-verification-otp")
  .post(otpSendRateLimiter, sendVerificationOtp);

router.route("/verify-email").post(otpVerifyRateLimiter, verifyEmail);

router.route("/forgot-password").post(passwordResetRateLimiter, forgotPassword);

router
  .route("/reset-password/:token")
  .post(passwordResetRateLimiter, resetPassword);

// Protected account routes.
router.route("/logout").post(verifyJWT, logoutRoles, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/current-user").get(verifyJWT, currentUserRoles, getCurrentUser);

router
  .route("/change-password")
  .post(verifyJWT, currentUserRoles, changeCurrentPassword);

router
  .route("/update-account")
  .patch(verifyJWT, authenticatedRoles, updateAccountDetails);

router
  .route("/avatar")
  .patch(
    verifyJWT,
    authenticatedRoles,
    upload.single("avatar"),
    updateUserAvatar
  );

export default router;
