import { PendingRegistration, User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getPlatformSettingsData } from "../services/admin.service.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

/**
 * Handles account authentication, email verification, and password recovery.
 * Controllers return sanitized user data and keep token rotation server-side.
 */
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_MIN = 100000;
const OTP_MAX = 1000000;
const OTP_EXPIRY_MS = 5 * 60 * 1000;

const getAuthCookieOptions = (req) => {
  const forwardedProto = req.get?.("x-forwarded-proto");
  const isHttpsRequest =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    forwardedProto === "https";

  return {
    httpOnly: true,
    secure: isHttpsRequest,
    sameSite: isHttpsRequest ? "none" : "strict",
    path: "/",
  };
};

const isStudentEmail = (email) => {
  const domain = email.split("@")[1];
  return domain?.toLowerCase().endsWith("edu.np");
};

const getEmailTransporter = () => {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPassword = process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD;
  const timeout = Number(process.env.SMTP_TIMEOUT_MS) || 15000;
  const timeoutOptions = {
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
  };

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure =
      process.env.SMTP_SECURE === "true" ||
      (!process.env.SMTP_SECURE && port === 465);

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      requireTLS: !secure && port === 587,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      ...timeoutOptions,
    });
  }

  if ((process.env.EMAIL_SERVICE || "gmail").toLowerCase() === "gmail") {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      ...timeoutOptions,
    });
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    ...timeoutOptions,
  });
};

//for register
const registerUser = asyncHandler(async (req, res) => {
  throw new ApiError(400, "Please verify your email before registration.");
});

//for log in

const loginUser = asyncHandler(async (req, res) => {
  // Get data from request body
  const { email, password, loginType = "common" } = req.body || {};

  // 1. VALIDATION
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const loginSource = loginType === "admin" ? "admin" : "common";

  // Keep admin and student/client login surfaces separated.
  // 2. FIND USER
  const user = await User.findOne({
    email: normalizedEmail,
  });

  // Do not reveal whether email exists
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 3. LOGIN PAGE ROLE CHECK
  if (loginSource === "common" && user.role === "admin") {
    throw new ApiError(403, "Please use the Admin Login page.");
  }

  if (loginSource === "admin" && user.role !== "admin") {
    throw new ApiError(403, "Only administrators can log in here.");
  }

  // 4. PASSWORD CHECK
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 5. GENERATE TOKENS
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // 6. GET SAFE USER DATA
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging in");
  }

  // 7. COOKIE OPTIONS
  const options = getAuthCookieOptions(req);

  // 8. SEND RESPONSE
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
        },
        "Login successful"
      )
    );
});

//for log out
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      returnDocument: "after",
    }
  );

  const options = getAuthCookieOptions(req);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

// This controller is used to generate a new access token when the old access token expires.

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Rotate refresh tokens so a reused token is rejected on the next request.
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = getAuthCookieOptions(req);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, {}, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fatched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body; //in production level write  different update controller

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = fullName.trim();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "Invalid email format");
  }

  const existedUser = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: req.user?._id },
  });

  if (existedUser) {
    throw new ApiError(409, "Email already registered.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: normalizedFullName,
        email: normalizedEmail,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "problem while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar is updated successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change Successfully"));
});

//this two sendVerificationOtp and verifyEmail for verify user email(register)
const sendVerificationOtp = asyncHandler(async (req, res) => {
  let { fullName, email, password, confirmPassword, role } = req.body;

  if (
    [fullName, email, password, confirmPassword, role].some((f) => !f?.trim())
  ) {
    throw new ApiError(400, "All fields are required");
  }

  role = role.toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = fullName.trim();

  if (!["student", "client"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (role === "student" && !isStudentEmail(normalizedEmail)) {
    throw new ApiError(400, "Students must use .edu.np email");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existedUser = await User.findOne({ email: normalizedEmail });
  if (existedUser) {
    throw new ApiError(409, "Email already registered.");
  }

  const otp = crypto.randomInt(OTP_MIN, OTP_MAX).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  // Store pending registrations separately until email ownership is verified.
  let pendingUser = await PendingRegistration.findOne({
    email: normalizedEmail,
  });

  if (!pendingUser) {
    pendingUser = new PendingRegistration({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password,
      role,
      verificationOtp: hashedOtp,
      verificationOtpExpires: Date.now() + OTP_EXPIRY_MS,
    });
  } else {
    pendingUser.fullName = normalizedFullName;
    pendingUser.password = password;
    pendingUser.role = role;
    pendingUser.verificationOtp = hashedOtp;
    pendingUser.verificationOtpExpires = Date.now() + OTP_EXPIRY_MS;
  }

  await pendingUser.save();

  const platformSettings = await getPlatformSettingsData();
  const platformName = platformSettings.platformName;

  const message = `Hello,

Your ${platformName} verification code is

${otp}

This OTP expires in 5 minutes.

If you did not request this, ignore this email.`;

  try {
    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        process.env.EMAIL_USER ||
        process.env.SMTP_USER,
      to: normalizedEmail,
      subject: `Verify your ${platformName} email`,
      text: message,
    });
  } catch (error) {
    console.error("Nodemailer email verification error:", error);
    await PendingRegistration.deleteOne({ email: normalizedEmail });

    throw new ApiError(500, "OTP email could not be sent.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully."));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pendingUser = await PendingRegistration.findOne({
    email: normalizedEmail,
  });

  if (!pendingUser) {
    throw new ApiError(400, "Invalid OTP.");
  }

  if (pendingUser.verificationOtpExpires < Date.now()) {
    await PendingRegistration.deleteOne({ email: normalizedEmail });
    throw new ApiError(400, "OTP expired.");
  }

  // Compare hashes only; the raw OTP is never stored in MongoDB.
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (hashedOtp !== pendingUser.verificationOtp) {
    throw new ApiError(400, "Invalid OTP.");
  }

  const existedUser = await User.findOne({ email: normalizedEmail });
  if (existedUser) {
    await PendingRegistration.deleteOne({ email: normalizedEmail });
    throw new ApiError(409, "Email already registered.");
  }

  const user = await User.create({
    fullName: pendingUser.fullName,
    email: pendingUser.email,
    password: pendingUser.password,
    role: pendingUser.role,
  });

  await PendingRegistration.deleteOne({ email: normalizedEmail });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdUser, "Registration completed successfully.")
    );
});

//this two forgotPassword and resetPassword is for forgot passwod logic
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(404, "No account found with this email address.");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Email the raw token once while only the hashed token remains persisted.
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  const platformSettings = await getPlatformSettingsData();
  const platformName = platformSettings.platformName;

  const message = `Hello,

Click the link below to reset your password.

${resetUrl}

This link expires in 15 minutes.`;

  try {
    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        process.env.EMAIL_USER ||
        process.env.SMTP_USER,
      to: user.email,
      subject: `Reset your ${platformName} password`,
      text: message,
    });
  } catch (error) {
    console.error("Nodemailer password reset error:", error);

    user.passwordResetToken = "";
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(500, "Password reset email could not be sent.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset link sent to your email."));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body || {};

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!password || !confirmPassword) {
    throw new ApiError(400, "Password and confirm password are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or expired.");
  }

  user.password = password;
  user.passwordResetToken = "";
  user.passwordResetExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully."));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  changeCurrentPassword,
  sendVerificationOtp,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
