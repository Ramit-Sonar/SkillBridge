import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { buildClientSummary } from "../utils/buildClientSummary.js";
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

const getApplicationById = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application id");
  }

  const application = await Application.findById(applicationId)
    .select(
      "job student coverMessage estimatedCompletionTime whySuitable attachments status appliedAt acceptedAt rejectedAt withdrawnAt createdAt updatedAt"
    )
    .populate({
      path: "job",
      select:
        "_id client title category description requirements skills budget duration deadline complexity attachments status createdAt",
    })
    .populate({
      path: "student",
      select: "_id fullName avatar role profileCompleted",
    })
    .lean();

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  const studentId = application.student?._id?.toString();
  const clientId = application.job?.client?.toString();
  const loggedInUserId = req.user._id.toString();

  if (req.user.role === "student" && studentId !== loggedInUserId) {
    throw new ApiError(403, "You can view only your own applications");
  }

  if (req.user.role === "client" && clientId !== loggedInUserId) {
    throw new ApiError(
      403,
      "You can view only applications submitted to your jobs"
    );
  }

  if (!["student", "client", "admin"].includes(req.user.role)) {
    throw new ApiError(403, "You are not allowed to view this application");
  }

  const studentProfile = studentId
    ? await StudentProfile.findOne({ user: studentId })
        .select("bio education university skills github linkedin portfolio")
        .lean()
    : null;
  const studentVerification = studentId
    ? await Verification.findOne({ user: studentId, type: "student" })
        .select("status verifiedAt")
        .lean()
    : null;
  const clientSummary = application.job?.client
    ? await buildClientSummary(application.job.client)
    : null;

  const applicationDetails = {
    applicationId: application._id,
    status: application.status,
    appliedAt: application.appliedAt,
    acceptedAt: application.acceptedAt,
    rejectedAt: application.rejectedAt,
    withdrawnAt: application.withdrawnAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    coverMessage: application.coverMessage,
    estimatedCompletionTime: application.estimatedCompletionTime,
    whySuitable: application.whySuitable,
    attachments: application.attachments,
    job: application.job
      ? {
          jobId: application.job._id,
          title: application.job.title,
          category: application.job.category,
          description: application.job.description,
          requirements: application.job.requirements,
          skills: application.job.skills,
          budget: application.job.budget,
          duration: application.job.duration,
          deadline: application.job.deadline,
          complexity: application.job.complexity,
          attachments: application.job.attachments,
          status: application.job.status,
          createdAt: application.job.createdAt,
          client: clientSummary,
        }
      : null,
    student: application.student
      ? {
          studentId: application.student._id,
          fullName: application.student.fullName,
          avatar: application.student.avatar,
          profileCompleted: application.student.profileCompleted,
          verification: {
            status: studentVerification?.status || null,
            verifiedAt: studentVerification?.verifiedAt || null,
          },
          profile: {
            bio: studentProfile?.bio || "",
            education: studentProfile?.education || "",
            university: studentProfile?.university || "",
            skills: studentProfile?.skills || [],
            github: studentProfile?.github || "",
            linkedin: studentProfile?.linkedin || "",
            portfolio: studentProfile?.portfolio || "",
          },
        }
      : null,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        applicationDetails,
        "Application fetched successfully"
      )
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
