import mongoose from "mongoose";
import {
  Report,
  REPORT_REASONS,
  REPORT_STATUSES,
} from "../models/report.model.js";
import { User } from "../models/user.model.js";
import {
  buildReportSummary,
  getReportedUserDetailsData,
} from "../services/report.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteAttachments, uploadAttachments } from "../utils/attachment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeTempFiles } from "../utils/tempFile.js";

/*
 * Handles user report submissions and admin report review actions.
 * Report.status is updated only by admins after investigation.
 */
const populateReportUsers = (query) =>
  query
    .populate(
      "reporter",
      "_id fullName email role avatar accountStatus profileCompleted"
    )
    .populate(
      "reportedUser",
      "_id fullName email role avatar accountStatus profileCompleted"
    )
    .populate(
      "handledBy",
      "_id fullName email role avatar accountStatus profileCompleted"
    );

const escapeSearchRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createReport = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files;
  let uploadedAttachments = [];

  try {
    const { reportedUserId, reason, description } = req.body || {};

    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!["student", "client"].includes(req.user.role)) {
      throw new ApiError(403, "Only students and clients can submit reports");
    }

    if (!mongoose.isValidObjectId(reportedUserId)) {
      throw new ApiError(400, "Invalid reported user id");
    }

    if (req.user._id.toString() === reportedUserId.toString()) {
      throw new ApiError(400, "You cannot report your own account");
    }

    if (!REPORT_REASONS.includes(reason)) {
      throw new ApiError(400, "Report reason is invalid");
    }

    if (typeof description !== "string" || !description.trim()) {
      throw new ApiError(400, "Report description is required");
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > 500) {
      throw new ApiError(
        400,
        "Report description cannot exceed 500 characters"
      );
    }

    const reportedUser = await User.findById(reportedUserId).select("_id role");

    if (!reportedUser) {
      throw new ApiError(404, "Reported user not found");
    }

    if (!["student", "client"].includes(reportedUser.role)) {
      throw new ApiError(400, "Only students and clients can be reported");
    }

    uploadedAttachments = await uploadAttachments(uploadedFiles);

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUser._id,
      reason,
      description: trimmedDescription,
      attachments: uploadedAttachments,
    });

    uploadedAttachments = [];

    const populatedReport = await populateReportUsers(
      Report.findById(report._id)
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          buildReportSummary(populatedReport),
          "Report submitted successfully"
        )
      );
  } catch (error) {
    await deleteAttachments(uploadedAttachments);

    if (error?.name === "ValidationError") {
      throw new ApiError(400, error.message);
    }

    throw error;
  } finally {
    removeTempFiles(uploadedFiles);
  }
});

const getReports = asyncHandler(async (req, res) => {
  const { status, search } = req.query || {};
  const filter = {};

  if (status && status !== "all") {
    if (!REPORT_STATUSES.includes(status)) {
      throw new ApiError(400, "Report status is invalid");
    }

    filter.status = status;
  }

  if (typeof search === "string" && search.trim()) {
    const searchText = search.trim();
    const searchRegex = new RegExp(escapeSearchRegex(searchText), "i");
    const matchedUsers = await User.find({
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { role: searchRegex },
      ],
    })
      .select("_id")
      .lean();
    const matchedUserIds = matchedUsers.map((user) => user._id);

    filter.$or = [
      { reporter: { $in: matchedUserIds } },
      { reportedUser: { $in: matchedUserIds } },
      { reason: searchRegex },
      { description: searchRegex },
    ];
  }

  // Admin report list keeps populated users small for fast investigation cards.
  const reports = await populateReportUsers(
    Report.find(filter).sort({ createdAt: -1 })
  ).lean();

  const reportSummaries = reports.map((report) => buildReportSummary(report));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalReports: reportSummaries.length,
        reports: reportSummaries,
      },
      "Reports fetched successfully"
    )
  );
});

const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!mongoose.isValidObjectId(reportId)) {
    throw new ApiError(400, "Invalid report id");
  }

  const report = await populateReportUsers(Report.findById(reportId)).lean();

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        buildReportSummary(report),
        "Report fetched successfully"
      )
    );
});

const getReportedUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await getReportedUserDetailsData(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Reported user fetched successfully"));
});

const resolveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!mongoose.isValidObjectId(reportId)) {
    throw new ApiError(400, "Invalid report id");
  }

  const report = await Report.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  if (report.status === "resolved") {
    throw new ApiError(400, "Report is already resolved");
  }

  if (report.status === "dismissed") {
    throw new ApiError(400, "Dismissed reports cannot be resolved");
  }

  report.status = "resolved";
  report.handledBy = req.user._id;
  report.resolvedAt = new Date();
  report.dismissedAt = null;

  await report.save();

  const populatedReport = await populateReportUsers(
    Report.findById(report._id)
  ).lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        buildReportSummary(populatedReport),
        "Report resolved successfully"
      )
    );
});

const dismissReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!mongoose.isValidObjectId(reportId)) {
    throw new ApiError(400, "Invalid report id");
  }

  const report = await Report.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  if (report.status === "dismissed") {
    throw new ApiError(400, "Report is already dismissed");
  }

  if (report.status === "resolved") {
    throw new ApiError(400, "Resolved reports cannot be dismissed");
  }

  report.status = "dismissed";
  report.handledBy = req.user._id;
  report.dismissedAt = new Date();
  report.resolvedAt = null;

  await report.save();

  const populatedReport = await populateReportUsers(
    Report.findById(report._id)
  ).lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        buildReportSummary(populatedReport),
        "Report dismissed successfully"
      )
    );
});

export {
  createReport,
  dismissReport,
  getReportById,
  getReports,
  getReportedUserDetails,
  resolveReport,
};
