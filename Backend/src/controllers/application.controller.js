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

    let coverText = "";

    if (typeof coverLetter === "string") {
      coverText = coverLetter.trim();
    } else if (typeof coverMessage === "string") {
      coverText = coverMessage.trim();
    }

    let estimatedTime = "";

    if (typeof estimatedCompletionTime === "string") {
      estimatedTime = estimatedCompletionTime.trim();
    }

    let suitabilityText = "";

    if (typeof whySuitable === "string") {
      suitabilityText = whySuitable.trim();
    }

    if (!coverText || !estimatedTime || !suitabilityText) {
      throw new ApiError(
        400,
        "Cover letter, estimated completion time and suitability are required"
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

    const job = await Job.findById(jobId).select("status");

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (job.status === "closed") {
      throw new ApiError(
        400,
        "This job is closed and no longer accepts applications"
      );
    }

    if (job.status === "cancelled") {
      throw new ApiError(
        400,
        "This job is cancelled and no longer accepts applications"
      );
    }

    if (job.status !== "open") {
      throw new ApiError(400, "This job is not open for applications");
    }

    const existingApplication = await Application.exists({
      job: jobId,
      student: req.user._id,
    });

    if (existingApplication) {
      throw new ApiError(409, "You have already applied for this job");
    }

    const attachments = await uploadAttachments(uploadedFiles);

    let application;

    try {
      application = await Application.create({
        job: jobId,
        student: req.user._id,
        coverMessage: coverText,
        estimatedCompletionTime: estimatedTime,
        whySuitable: suitabilityText,
        attachments,
        status: "pending",
        appliedAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(409, "You have already applied for this job");
      }

      throw error;
    }

    const responseData = {
      applicationId: application._id,
      status: application.status,
      appliedAt: application.appliedAt,
    };

    return res
      .status(201)
      .json(
        new ApiResponse(201, responseData, "Application submitted successfully")
      );
  } finally {
    removeTempFiles(uploadedFiles);
  }
});

const getMyApplications = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can view their applications");
  }

  const applications = await Application.find({
    student: req.user._id,
  })
    .select("_id job status appliedAt")
    .populate({
      path: "job",
      select: "_id title budget category status client",
      populate: {
        path: "client",
        select: "fullName",
      },
    })
    .sort({ appliedAt: -1 })
    .lean();

  const applicationList = applications.map((application) => ({
    applicationId: application._id,
    status: application.status,
    appliedAt: application.appliedAt,
    job: application.job
      ? {
          jobId: application.job._id,
          title: application.job.title,
          budget: application.job.budget,
          jobType: application.job.category,
          status: application.job.status,
          clientName: application.job.client?.fullName || "",
        }
      : null,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalApplications: applicationList.length,
        applications: applicationList,
      },
      "Applications fetched successfully"
    )
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
