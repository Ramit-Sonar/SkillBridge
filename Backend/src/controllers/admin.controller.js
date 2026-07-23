import mongoose from "mongoose";
import {
  getAdminDashboardSummaryData,
  getAdminUserDetailsData,
  getAdminUsersData,
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

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await updateAdminUserAccountStatus(userId, "suspended");

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

  const user = await updateAdminUserAccountStatus(userId, "active");

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
  getAdminUserById,
  getAdminUsers,
  suspendAdminUser,
};
