import mongoose from "mongoose";
import {
  getAdminDashboardSummaryData,
  getAdminJobDetailsData,
  getAdminJobsData,
  getAdminUserDetailsData,
  getAdminUsersData,
  getPlatformSettingsData,
  suspendAdminJobData,
  updateMaintenanceSettingsData,
  updateAdminUserAccountStatus,
} from "../services/admin.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Handles admin-only user management actions.
 */
const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await getAdminUsersData();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers: users.length,
        users,
      },
      "Users fetched successfully"
    )
  );
});

const getAdminDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await getAdminDashboardSummaryData();

  return res
    .status(200)
    .json(
      new ApiResponse(200, summary, "Admin dashboard fetched successfully")
    );
});

const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await getPlatformSettingsData();

  return res
    .status(200)
    .json(
      new ApiResponse(200, settings, "Admin settings fetched successfully")
    );
});

const updateMaintenanceSettings = asyncHandler(async (req, res) => {
  const { maintenanceMode } = req.body || {};
  const maintenanceMessage =
    typeof req.body?.maintenanceMessage === "string"
      ? req.body.maintenanceMessage
      : "";

  if (typeof maintenanceMode !== "boolean") {
    throw new ApiError(400, "Maintenance mode value is required");
  }

  const settings = await updateMaintenanceSettingsData({
    maintenanceMode,
    maintenanceMessage,
    adminUserId: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        settings,
        "Maintenance settings updated successfully"
      )
    );
});

const getAdminJobs = asyncHandler(async (req, res) => {
  const jobs = await getAdminJobsData({
    search: typeof req.query.search === "string" ? req.query.search : "",
    status: typeof req.query.status === "string" ? req.query.status : "all",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalJobs: jobs.length,
        jobs,
      },
      "Jobs fetched successfully"
    )
  );
});

const getAdminJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await getAdminJobDetailsData(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, job, "Job fetched successfully"));
});

const suspendAdminJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const moderationReason =
    typeof req.body?.moderationReason === "string"
      ? req.body.moderationReason.trim()
      : "";
  const customModerationReason =
    typeof req.body?.customModerationReason === "string"
      ? req.body.customModerationReason.trim()
      : "";

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  if (!moderationReason) {
    throw new ApiError(400, "Moderation reason is required");
  }

  const job = await suspendAdminJobData({
    jobId,
    adminUserId: req.user._id,
    moderationReason,
    customModerationReason,
  });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.error) {
    throw new ApiError(400, job.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, job, "Job suspended successfully"));
});

const getAdminUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await getAdminUserDetailsData(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const suspendAdminUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const suspensionReason =
    typeof req.body?.suspensionReason === "string"
      ? req.body.suspensionReason.trim()
      : "";

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  if (!suspensionReason) {
    throw new ApiError(400, "Suspension reason is required");
  }

  const user = await updateAdminUserAccountStatus(
    userId,
    "suspended",
    req.user._id,
    suspensionReason
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User suspended successfully"));
});

const activateAdminUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await updateAdminUserAccountStatus(
    userId,
    "active",
    req.user._id
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User activated successfully"));
});

export {
  activateAdminUser,
  getAdminDashboardSummary,
  getAdminJobById,
  getAdminJobs,
  getAdminSettings,
  getAdminUserById,
  getAdminUsers,
  suspendAdminJob,
  suspendAdminUser,
  updateMaintenanceSettings,
};
