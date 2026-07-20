import mongoose from "mongoose";
import { StudentProfile } from "../models/studentProfile.model.js";
import { User } from "../models/user.model.js";
import { Verification } from "../models/verification.model.js";
import { buildStudentSummary } from "../services/application.service.js";
import { getStudentCompletedProjectProfileMap } from "../services/project.service.js";
import { getStudentReviewProfileMap } from "../services/review.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Handles private profile updates and public student profile aggregation.
 */
const getStudentProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Student profile fetched successfully")
    );
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  const { bio, education, university, skills, github, linkedin, portfolio } =
    req.body || {};

  const updateData = {};

  if (bio !== undefined) updateData.bio = bio;
  if (education !== undefined) updateData.education = education;
  if (university !== undefined) updateData.university = university;
  if (skills !== undefined) updateData.skills = skills;
  if (github !== undefined) updateData.github = github;
  if (linkedin !== undefined) updateData.linkedin = linkedin;
  if (portfolio !== undefined) updateData.portfolio = portfolio;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No profile fields provided");
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: updateData,
      $setOnInsert: { user: req.user._id },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile updated successfully."));
});

const getPublicStudentProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, "Invalid student id");
  }

  const student = await User.findOne({ _id: studentId, role: "student" })
    .select("_id fullName avatar profileCompleted")
    .lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const [
    studentProfile,
    studentVerification,
    studentProjectProfileMap,
    studentReviewProfileMap,
  ] = await Promise.all([
    StudentProfile.findOne({ user: studentId })
      .select("bio education university skills github linkedin portfolio")
      .lean(),
    Verification.findOne({ user: studentId, type: "student" })
      .select("status verifiedAt")
      .lean(),
    getStudentCompletedProjectProfileMap([studentId]),
    getStudentReviewProfileMap([studentId]),
  ]);

  // Public profiles combine editable profile fields with computed trust metrics.
  const publicProfile = buildStudentSummary({
    student,
    studentProfile,
    studentVerification,
    studentProjectProfile: studentProjectProfileMap.get(studentId),
    studentReviewProfile: studentReviewProfileMap.get(studentId),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        publicProfile,
        "Public student profile fetched successfully"
      )
    );
});

export { getPublicStudentProfile, getStudentProfile, updateStudentProfile };
