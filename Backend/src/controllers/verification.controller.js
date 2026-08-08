/*
 * Handles student/client verification submissions and admin review actions.
 * Verification.status is the source of truth for account trust state.
 */
import { Verification } from "../models/verification.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getInitials } from "../utils/text.js";
import mongoose from "mongoose";

const toAdminStudentVerification = (verification) => {
  const user = verification.user || {};
  const fullName = user.fullName || "Unknown Student";

  return {
    id: verification._id,
    name: fullName,
    initials: getInitials(fullName),
    email: user.email || "",
    role: "Student",
    avatar: user.avatar || "",
    status: verification.status,
    collegeName: verification.collegeName || "",
    studentId: verification.studentId || "",
    collegeIdCard: verification.collegeIdCard || "",
    studentSelfie: verification.studentSelfie || "",
    submittedAt: verification.submittedAt,
  };
};

const toAdminClientVerification = (verification) => {
  const user = verification.user || {};
  const fullName = user.fullName || "Unknown Client";

  return {
    id: verification._id,
    name: fullName,
    initials: getInitials(fullName),
    email: user.email || "",
    role: "Client",
    status: verification.status,
    legalName: verification.legalName || "",
    phone: verification.phone || "",
    companyName: verification.companyName || "",
    citizenshipFront: verification.citizenshipFront || "",
    citizenshipSelfie: verification.citizenshipSelfie || "",
    companyRegistrationDocument: verification.companyRegistrationDocument || "",
    submittedAt: verification.submittedAt,
    approvedBy: verification.approvedBy || null,
    approvedAt: verification.approvedAt || null,
    rejectedBy: verification.rejectedBy || null,
    rejectedAt: verification.rejectedAt || null,
  };
};

/**
 * Stores a student verification request for admin review.
 */
const submitStudentVerification = asyncHandler(async (req, res) => {
  const { university, studentId } = req.body || {};

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can submit student verification");
  }

  if (!university?.trim() || !studentId?.trim()) {
    throw new ApiError(400, "College name and student ID are required");
  }

  const collegeIdCardLocalPath = req.files?.idCard?.[0]?.path;
  const studentSelfieLocalPath = req.files?.selfie?.[0]?.path;

  if (!collegeIdCardLocalPath || !studentSelfieLocalPath) {
    throw new ApiError(400, "College ID card and student selfie are required");
  }

  const existingVerification = await Verification.findOne({
    user: req.user._id,
  });

  // Users must update rejected requests instead of creating parallel records.
  if (existingVerification?.status === "pending") {
    throw new ApiError(409, "Verification request is already pending");
  }

  if (existingVerification?.status === "approved") {
    throw new ApiError(409, "Student verification is already approved");
  }

  if (existingVerification?.status === "rejected") {
    throw new ApiError(
      409,
      "Rejected verification must be updated instead of submitted again"
    );
  }

  const collegeIdCard = await uploadOnCloudinary(collegeIdCardLocalPath);

  if (!collegeIdCard?.url) {
    throw new ApiError(500, "College ID card upload failed");
  }

  const studentSelfie = await uploadOnCloudinary(studentSelfieLocalPath);

  if (!studentSelfie?.url) {
    throw new ApiError(500, "Student selfie upload failed");
  }

  const verification = await Verification.create({
    user: req.user._id,
    type: "student",
    status: "pending",
    collegeName: university.trim(),
    studentId: studentId.trim(),
    collegeIdCard: collegeIdCard.url,
    studentSelfie: studentSelfie.url,
    submittedAt: new Date(),
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: "",
  });

  // A new pending request must not leave a stale verified flag on the user.
  await User.findByIdAndUpdate(req.user._id, { isVerified: false });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        verification,
        "Student verification submitted successfully"
      )
    );
});

/**
 * Stores a client KYC request for admin review.
 */
const submitClientVerification = asyncHandler(async (req, res) => {
  const { legalName, phone, companyKyc, companyName } = req.body || {};

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can submit client verification");
  }

  if (!legalName?.trim() || !phone?.trim()) {
    throw new ApiError(400, "Legal name and phone number are required");
  }

  const citizenshipFrontLocalPath = req.files?.citizenshipFront?.[0]?.path;
  const citizenshipSelfieLocalPath = req.files?.citizenshipSelfie?.[0]?.path;
  const companyRegistrationLocalPath =
    req.files?.companyRegistration?.[0]?.path;

  if (!citizenshipFrontLocalPath || !citizenshipSelfieLocalPath) {
    throw new ApiError(
      400,
      "Citizenship front photo and citizenship selfie are required"
    );
  }

  const existingVerification = await Verification.findOne({
    user: req.user._id,
  });

  // Users must update rejected requests instead of creating parallel records.
  if (existingVerification?.status === "pending") {
    throw new ApiError(409, "Verification request is already pending");
  }

  if (existingVerification?.status === "approved") {
    throw new ApiError(409, "Client verification is already approved");
  }

  if (existingVerification?.status === "rejected") {
    throw new ApiError(
      409,
      "Rejected verification must be updated instead of submitted again"
    );
  }

  const citizenshipFront = await uploadOnCloudinary(citizenshipFrontLocalPath);

  if (!citizenshipFront?.url) {
    throw new ApiError(500, "Citizenship front photo upload failed");
  }

  const citizenshipSelfie = await uploadOnCloudinary(
    citizenshipSelfieLocalPath
  );

  if (!citizenshipSelfie?.url) {
    throw new ApiError(500, "Citizenship selfie upload failed");
  }

  let companyRegistrationDocument = "";

  if (companyRegistrationLocalPath) {
    const companyRegistration = await uploadOnCloudinary(
      companyRegistrationLocalPath
    );

    if (!companyRegistration?.url) {
      throw new ApiError(500, "Company registration document upload failed");
    }

    companyRegistrationDocument = companyRegistration.url;
  }

  const verification = await Verification.create({
    user: req.user._id,
    type: "client",
    status: "pending",
    legalName: legalName.trim(),
    phone: phone.trim(),
    companyName: (companyKyc || companyName || "").trim(),
    citizenshipFront: citizenshipFront.url,
    citizenshipSelfie: citizenshipSelfie.url,
    companyRegistrationDocument,
    submittedAt: new Date(),
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: "",
  });

  // A new pending request must not leave a stale verified flag on the user.
  await User.findByIdAndUpdate(req.user._id, { isVerified: false });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        verification,
        "Client verification submitted successfully"
      )
    );
});

/**
 * Returns the logged-in user's current verification record, if one exists.
 */
const getVerificationStatus = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const verification = await Verification.findOne({
    user: req.user._id,
  });

  if (!verification) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No verification submitted."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, verification, "Verification fetched successfully")
    );
});

/**
 * Lists student verification requests for the admin dashboard.
 */
const getAdminStudentVerifications = asyncHandler(async (req, res) => {
  // Populate only the user fields required to render admin review cards.
  const verifications = await Verification.find({ type: "student" })
    .populate("user", "fullName email role avatar")
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        verifications.map(toAdminStudentVerification),
        "Student verifications fetched successfully"
      )
    );
});

/**
 * Fetches one student verification request for admin review.
 */
const getAdminStudentVerificationById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid verification id");
  }

  const verification = await Verification.findOne({
    _id: req.params.id,
    type: "student",
  })
    .populate("user", "fullName email role avatar")
    .lean();

  if (!verification) {
    throw new ApiError(404, "Student verification not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toAdminStudentVerification(verification),
        "Student verification fetched successfully"
      )
    );
});

/**
 * Lists client KYC requests for the admin dashboard.
 */
const getAdminClientVerifications = asyncHandler(async (req, res) => {
  // Populate only the user fields required to render admin review cards.
  const verifications = await Verification.find({ type: "client" })
    .populate("user", "fullName email role avatar")
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        verifications.map(toAdminClientVerification),
        "Client verifications fetched successfully"
      )
    );
});

/**
 * Approves a verification request and syncs the user's verified flag.
 */
const approveVerification = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid verification id");
  }

  const verification = await Verification.findById(req.params.id);

  if (!verification) {
    throw new ApiError(404, "Verification not found");
  }

  const approvedAt = new Date();

  verification.status = "approved";
  verification.approvedBy = req.user._id;
  verification.approvedAt = approvedAt;
  verification.rejectedBy = null;
  verification.rejectedAt = null;
  verification.verifiedBy = req.user._id;
  verification.verifiedAt = approvedAt;
  verification.rejectionReason = "";

  await verification.save();
  await User.findByIdAndUpdate(verification.user, { isVerified: true });

  return res
    .status(200)
    .json(
      new ApiResponse(200, verification, "Verification approved successfully")
    );
});

/**
 * Rejects a verification request and keeps the user account unverified.
 */
const rejectVerification = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid verification id");
  }

  const verification = await Verification.findById(req.params.id);

  if (!verification) {
    throw new ApiError(404, "Verification not found");
  }

  const rejectedAt = new Date();

  verification.status = "rejected";
  verification.rejectedBy = req.user._id;
  verification.rejectedAt = rejectedAt;
  verification.approvedBy = null;
  verification.approvedAt = null;
  verification.verifiedBy = null;
  verification.verifiedAt = null;

  await verification.save();
  await User.findByIdAndUpdate(verification.user, { isVerified: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, verification, "Verification rejected successfully")
    );
});

/**
 * Resubmits a rejected student verification request for admin review.
 */
const updateStudentVerification = asyncHandler(async (req, res) => {
  const { university, studentId } = req.body || {};

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can update student verification");
  }

  if (!university?.trim() || !studentId?.trim()) {
    throw new ApiError(400, "College name and student ID are required");
  }

  const verification = await Verification.findOne({
    user: req.user._id,
    type: "student",
  });

  if (!verification) {
    throw new ApiError(404, "Student verification not found");
  }

  if (verification.type !== "student") {
    throw new ApiError(400, "Invalid verification type");
  }

  if (verification.status === "pending") {
    throw new ApiError(
      409,
      "Student verification cannot be edited while under review"
    );
  }

  if (verification.status === "approved") {
    throw new ApiError(409, "Approved verification cannot be modified");
  }

  if (verification.status !== "rejected") {
    throw new ApiError(400, "Only rejected verification can be updated");
  }

  const collegeIdCardLocalPath = req.files?.idCard?.[0]?.path;
  const studentSelfieLocalPath = req.files?.selfie?.[0]?.path;

  if (collegeIdCardLocalPath) {
    const collegeIdCard = await uploadOnCloudinary(collegeIdCardLocalPath);

    if (!collegeIdCard?.url) {
      throw new ApiError(500, "College ID card upload failed");
    }

    verification.collegeIdCard = collegeIdCard.url;
  }

  if (studentSelfieLocalPath) {
    const studentSelfie = await uploadOnCloudinary(studentSelfieLocalPath);

    if (!studentSelfie?.url) {
      throw new ApiError(500, "Student selfie upload failed");
    }

    verification.studentSelfie = studentSelfie.url;
  }

  verification.collegeName = university.trim();
  verification.studentId = studentId.trim();
  verification.status = "pending";
  verification.submittedAt = new Date();
  verification.verifiedBy = null;
  verification.verifiedAt = null;
  verification.approvedBy = null;
  verification.approvedAt = null;
  verification.rejectedBy = null;
  verification.rejectedAt = null;
  verification.rejectionReason = "";

  await verification.save();

  // Resubmission returns the request to pending, so the account is not verified yet.
  await User.findByIdAndUpdate(req.user._id, { isVerified: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        verification,
        "Student verification updated successfully"
      )
    );
});

/**
 * Resubmits a rejected client verification request for admin review.
 */
const updateClientVerification = asyncHandler(async (req, res) => {
  const { legalName, phone, companyKyc, companyName } = req.body || {};

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can update client verification");
  }

  if (!legalName?.trim() || !phone?.trim()) {
    throw new ApiError(400, "Legal name and phone number are required");
  }

  const verification = await Verification.findOne({
    user: req.user._id,
    type: "client",
  });

  if (!verification) {
    throw new ApiError(404, "Client verification not found");
  }

  if (verification.type !== "client") {
    throw new ApiError(400, "Invalid verification type");
  }

  if (verification.status === "pending") {
    throw new ApiError(
      409,
      "Client verification cannot be edited while under review"
    );
  }

  if (verification.status === "approved") {
    throw new ApiError(409, "Approved verification cannot be modified");
  }

  if (verification.status !== "rejected") {
    throw new ApiError(400, "Only rejected verification can be updated");
  }

  const citizenshipFrontLocalPath = req.files?.citizenshipFront?.[0]?.path;
  const citizenshipSelfieLocalPath = req.files?.citizenshipSelfie?.[0]?.path;
  const companyRegistrationLocalPath =
    req.files?.companyRegistration?.[0]?.path;

  if (citizenshipFrontLocalPath) {
    const citizenshipFront = await uploadOnCloudinary(
      citizenshipFrontLocalPath
    );

    if (!citizenshipFront?.url) {
      throw new ApiError(500, "Citizenship front photo upload failed");
    }

    verification.citizenshipFront = citizenshipFront.url;
  }

  if (citizenshipSelfieLocalPath) {
    const citizenshipSelfie = await uploadOnCloudinary(
      citizenshipSelfieLocalPath
    );

    if (!citizenshipSelfie?.url) {
      throw new ApiError(500, "Citizenship selfie upload failed");
    }

    verification.citizenshipSelfie = citizenshipSelfie.url;
  }

  if (companyRegistrationLocalPath) {
    const companyRegistration = await uploadOnCloudinary(
      companyRegistrationLocalPath
    );

    if (!companyRegistration?.url) {
      throw new ApiError(500, "Company registration document upload failed");
    }

    verification.companyRegistrationDocument = companyRegistration.url;
  }

  verification.legalName = legalName.trim();
  verification.phone = phone.trim();
  verification.companyName = (companyKyc || companyName || "").trim();
  verification.status = "pending";
  verification.submittedAt = new Date();
  verification.verifiedBy = null;
  verification.verifiedAt = null;
  verification.approvedBy = null;
  verification.approvedAt = null;
  verification.rejectedBy = null;
  verification.rejectedAt = null;
  verification.rejectionReason = "";

  await verification.save();

  // Resubmission returns the request to pending, so the account is not verified yet.
  await User.findByIdAndUpdate(req.user._id, { isVerified: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        verification,
        "Client verification updated successfully"
      )
    );
});

export {
  submitStudentVerification,
  submitClientVerification,
  getVerificationStatus,
  getAdminStudentVerifications,
  getAdminStudentVerificationById,
  getAdminClientVerifications,
  approveVerification,
  rejectVerification,
  updateStudentVerification,
  updateClientVerification,
};
