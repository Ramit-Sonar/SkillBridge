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
  otpRateLimiter,
  passwordResetRateLimiter,
  registerRateLimiter,
} from "../middlewares/security.middleware.js";

const router = Router();
const authenticatedRoles = authorizeRoles("student", "client");
const currentUserRoles = authorizeRoles("student", "client", "admin");
const logoutRoles = authorizeRoles("student", "client", "admin");

// Authentication, account, and recovery routes for all user roles.
router.route("/register").post(registerRateLimiter, registerUser);

router.route("/login").post(loginRateLimiter, loginUser);

//for logout
router
  .route("/send-verification-otp")
  .post(otpRateLimiter, sendVerificationOtp);

router.route("/verify-email").post(otpRateLimiter, verifyEmail);

//for forgot password
router.route("/forgot-password").post(passwordResetRateLimiter, forgotPassword);

router
  .route("/reset-password/:token")
  .post(passwordResetRateLimiter, resetPassword);

//secure route
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
