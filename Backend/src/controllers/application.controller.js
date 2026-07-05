import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  buildApplicantSummary,
  buildApplicationDetails,
  buildApplicationSummary,
} from "../utils/applicationResponse.js";
import { buildClientSummary } from "../utils/buildClientSummary.js";
import { deleteAttachments, uploadAttachments } from "../utils/attachment.js";
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

    const job = await Job.findById(jobId).select("client status");

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (job.client.toString() === req.user._id.toString()) {
      throw new ApiError(400, "You cannot apply to your own job");
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
      await deleteAttachments(attachments);

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

  const applicationList = applications.map((application) =>
    buildApplicationSummary(application)
  );

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

const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can view job applications");
  }

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(jobId).select("client").lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.client.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can view applications only for your own jobs");
  }

  const applications = await Application.find({ job: jobId })
    .select("_id student status appliedAt")
    .populate({
      path: "student",
      select: "_id fullName avatar profileCompleted",
    })
    .sort({ appliedAt: -1 })
    .lean();

  const studentIds = applications
    .map((application) => application.student?._id)
    .filter(Boolean);

  const [studentProfiles, studentVerifications] = await Promise.all([
    StudentProfile.find({ user: { $in: studentIds } })
      .select("user education university skills portfolio")
      .lean(),
    Verification.find({ user: { $in: studentIds }, type: "student" })
      .select("user status verifiedAt")
      .lean(),
  ]);

  const studentProfileMap = new Map(
    studentProfiles.map((profile) => [profile.user.toString(), profile])
  );
  const studentVerificationMap = new Map(
    studentVerifications.map((verification) => [
      verification.user.toString(),
      verification,
    ])
  );

  const applicants = applications.map((application) => {
    const studentId = application.student?._id?.toString();

    return buildApplicantSummary({
      application,
      studentProfile: studentProfileMap.get(studentId),
      studentVerification: studentVerificationMap.get(studentId),
    });
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalApplications: applicants.length,
        applicants,
      },
      "Job applications fetched successfully"
    )
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
      select: "_id fullName avatar profileCompleted",
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

  const [studentProfile, studentVerification, clientSummary] =
    await Promise.all([
      studentId
        ? StudentProfile.findOne({ user: studentId })
            .select("bio education university skills github linkedin portfolio")
            .lean()
        : null,
      studentId
        ? Verification.findOne({ user: studentId, type: "student" })
            .select("status verifiedAt")
            .lean()
        : null,
      application.job?.client
        ? buildClientSummary(application.job.client)
        : null,
    ]);
  const applicationDetails = buildApplicationDetails({
    application,
    studentProfile,
    studentVerification,
    clientSummary,
  });

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

const withdrawApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can withdraw applications");
  }

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application id");
  }

  const application = await Application.findById(applicationId).select(
    "student status appliedAt withdrawnAt updatedAt"
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.student.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can withdraw only your own application");
  }

  if (application.status === "accepted") {
    throw new ApiError(400, "Accepted applications cannot be withdrawn");
  }

  if (application.status === "rejected") {
    throw new ApiError(400, "Rejected applications cannot be withdrawn");
  }

  if (application.status === "withdrawn") {
    throw new ApiError(400, "Application is already withdrawn");
  }

  if (application.status !== "pending") {
    throw new ApiError(400, "Only pending applications can be withdrawn");
  }

  const withdrawnApplication = await Application.findOneAndUpdate(
    {
      _id: application._id,
      status: "pending",
    },
    {
      $set: {
        status: "withdrawn",
        withdrawnAt: new Date(),
      },
    },
    {
      new: true,
    }
  ).select("_id status appliedAt withdrawnAt updatedAt");

  if (!withdrawnApplication) {
    throw new ApiError(400, "Only pending applications can be withdrawn");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        applicationId: withdrawnApplication._id,
        status: withdrawnApplication.status,
        appliedAt: withdrawnApplication.appliedAt,
        withdrawnAt: withdrawnApplication.withdrawnAt,
        updatedAt: withdrawnApplication.updatedAt,
      },
      "Application withdrawn successfully"
    )
  );
});

const acceptApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can accept applications");
  }

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application id");
  }

  const session = await mongoose.startSession();
  let responseData;

  try {
    await session.withTransaction(async () => {
      const application = await Application.findById(applicationId)
        .select("job status appliedAt")
        .session(session);

      if (!application) {
        throw new ApiError(404, "Application not found");
      }

      const job = await Job.findById(application.job)
        .select("client status")
        .session(session);

      if (!job) {
        throw new ApiError(404, "Job not found");
      }

      if (job.client.toString() !== req.user._id.toString()) {
        throw new ApiError(
          403,
          "You can accept applications only for your own jobs"
        );
      }

      if (application.status === "accepted") {
        throw new ApiError(400, "Application is already accepted");
      }

      if (application.status === "rejected") {
        throw new ApiError(400, "Rejected applications cannot be accepted");
      }

      if (application.status === "withdrawn") {
        throw new ApiError(400, "Withdrawn applications cannot be accepted");
      }

      if (application.status !== "pending") {
        throw new ApiError(400, "Only pending applications can be accepted");
      }

      if (job.status === "closed") {
        throw new ApiError(400, "Closed jobs cannot accept applications");
      }

      if (job.status === "cancelled") {
        throw new ApiError(400, "Cancelled jobs cannot accept applications");
      }

      if (job.status !== "open") {
        throw new ApiError(400, "Only open jobs can accept applications");
      }

      const decisionDate = new Date();
      const acceptedApplication = await Application.findOneAndUpdate(
        {
          _id: application._id,
          status: "pending",
        },
        {
          $set: {
            status: "accepted",
            acceptedAt: decisionDate,
          },
        },
        {
          new: true,
          session,
        }
      ).select("_id job student status appliedAt acceptedAt updatedAt");

      if (!acceptedApplication) {
        throw new ApiError(400, "Only pending applications can be accepted");
      }

      const rejectedApplications = await Application.updateMany(
        {
          job: application.job,
          _id: { $ne: application._id },
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
            rejectedAt: decisionDate,
          },
        },
        { session }
      );

      const closedJob = await Job.findOneAndUpdate(
        {
          _id: job._id,
          status: "open",
        },
        {
          $set: {
            status: "closed",
          },
        },
        {
          new: true,
          session,
        }
      ).select("_id status");

      if (!closedJob) {
        throw new ApiError(400, "Only open jobs can accept applications");
      }

      // Phase 8: create a Project from the accepted application here.
      responseData = {
        applicationId: acceptedApplication._id,
        status: acceptedApplication.status,
        appliedAt: acceptedApplication.appliedAt,
        acceptedAt: acceptedApplication.acceptedAt,
        updatedAt: acceptedApplication.updatedAt,
        rejectedApplicationsCount: rejectedApplications.modifiedCount,
        job: {
          jobId: closedJob._id,
          status: closedJob.status,
        },
      };
    });
  } finally {
    await session.endSession();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, responseData, "Application accepted successfully")
    );
});

const rejectApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can reject applications");
  }

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application id");
  }

  const application = await Application.findById(applicationId).select(
    "job status appliedAt rejectedAt updatedAt"
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  const job = await Job.findById(application.job)
    .select("client status")
    .lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.client.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You can reject applications only for your own jobs"
    );
  }

  if (job.status === "cancelled") {
    throw new ApiError(400, "Cancelled jobs cannot process applications");
  }

  if (application.status === "accepted") {
    throw new ApiError(400, "Accepted applications cannot be rejected");
  }

  if (application.status === "rejected") {
    throw new ApiError(400, "Application is already rejected");
  }

  if (application.status === "withdrawn") {
    throw new ApiError(400, "Withdrawn applications cannot be rejected");
  }

  if (application.status !== "pending") {
    throw new ApiError(400, "Only pending applications can be rejected");
  }

  const rejectedApplication = await Application.findOneAndUpdate(
    {
      _id: application._id,
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        rejectedAt: new Date(),
      },
    },
    {
      new: true,
    }
  ).select("_id status appliedAt rejectedAt updatedAt");

  if (!rejectedApplication) {
    throw new ApiError(400, "Only pending applications can be rejected");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        applicationId: rejectedApplication._id,
        status: rejectedApplication.status,
        appliedAt: rejectedApplication.appliedAt,
        rejectedAt: rejectedApplication.rejectedAt,
        updatedAt: rejectedApplication.updatedAt,
      },
      "Application rejected successfully"
    )
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
