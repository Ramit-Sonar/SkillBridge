import { ClientProfile } from "../models/clientProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Handles client profile reads and upserts for the authenticated client.
 */
const getClientProfile = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ user: req.user._id });

  if (!profile) {
    throw new ApiError(404, "Client profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Client profile fetched successfully"));
});

const updateClientProfile = asyncHandler(async (req, res) => {
  const { bio, location, companyName, website } = req.body || {};

  const updateData = {};

  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (website !== undefined) updateData.website = website;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No profile fields provided");
  }

  const profile = await ClientProfile.findOneAndUpdate(
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

export { getClientProfile, updateClientProfile };
