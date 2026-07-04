import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadAttachments } from "../utils/attachment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeTempFiles } from "../utils/tempFile.js";

const submitApplication = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files;

  try {
    const { jobId } = req.params;
    const { coverLetter, coverMessage, estimatedCompletionTime, whySuitable } =
      req.body || {};

    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (req.user.role !== "student") {
      throw new ApiError(403, "Only students can apply for jobs");
    }

    if (!mongoose.isValidObjectId(jobId)) {
      throw new ApiError(400, "Invalid job id");
    }

    const coverText = (coverLetter || coverMessage || "").trim();

    if (
      !coverText ||
      !estimatedCompletionTime?.trim() ||
      !whySuitable?.trim()
    ) {
      throw new ApiError(
        400,
        "Cover letter, estimated completion time and suitability are required"
      );
    }

    const job = await Job.findById(jobId).select("status");

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (job.status !== "open") {
      throw new ApiError(
        400,
        "This job is closed and no longer accepts applications"
      );
    }

    const verification = await Verification.findOne({
      user: req.user._id,
      type: "student",
    }).select("status");

    if (verification?.status !== "approved") {
      throw new ApiError(
        403,
        "Student verification is required before applying"
      );
    }

    const existingApplication = await Application.exists({
      job: jobId,
      student: req.user._id,
    });

    if (existingApplication) {
      throw new ApiError(409, "You have already applied for this job");
    }

    const attachments = await uploadAttachments(uploadedFiles);

    const application = await Application.create({
      job: jobId,
      student: req.user._id,
      coverMessage: coverText,
      estimatedCompletionTime: estimatedCompletionTime.trim(),
      whySuitable: whySuitable.trim(),
      attachments,
      status: "pending",
      appliedAt: new Date(),
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, application, "Application submitted successfully")
      );
  } finally {
    removeTempFiles(uploadedFiles);
  }
});

const getMyApplications = asyncHandler(async () => {
  throw new ApiError(
    501,
    "Get my applications controller logic has not been implemented yet"
  );
});

const getJobApplications = asyncHandler(async () => {
  throw new ApiError(
    501,
    "Get job applications controller logic has not been implemented yet"
  );
});

const getApplicationById = asyncHandler(async () => {
  throw new ApiError(
    501,
    "Get application by id controller logic has not been implemented yet"
  );
});

const withdrawApplication = asyncHandler(async () => {
  throw new ApiError(
    501,
    "Withdraw application controller logic has not been implemented yet"
  );
});

const acceptApplication = asyncHandler(async () => {
  throw new ApiError(
    501,
    "Accept application controller logic has not been implemented yet"
  );
});

const rejectApplication = asyncHandler(async () => {
  throw new ApiError(
    501,
    "Reject application controller logic has not been implemented yet"
  );
});

export {
  acceptApplication,
  getApplicationById,
  getJobApplications,
  getMyApplications,
  rejectApplication,
  submitApplication,
  withdrawApplication,
};
