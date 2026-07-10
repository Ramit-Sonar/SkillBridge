import { Review } from "../models/review.model.js";
import {
  buildReviewSummary,
  canReviewProject,
} from "../services/review.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createReview = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { rating, comment } = req.body || {};

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can create reviews");
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new ApiError(400, "Rating must be a number between 1 and 5");
  }

  if (
    comment !== undefined &&
    comment !== null &&
    typeof comment !== "string"
  ) {
    throw new ApiError(400, "Comment must be text");
  }

  const project = await canReviewProject(projectId, req.user._id);
  const trimmedComment = typeof comment === "string" ? comment.trim() : "";

  try {
    const review = await Review.create({
      project: project._id,
      student: project.student,
      client: req.user._id,
      rating: numericRating,
      comment: trimmedComment,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          buildReviewSummary(review),
          "Review created successfully"
        )
      );
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "This project has already been reviewed");
    }

    if (error?.name === "ValidationError") {
      throw new ApiError(400, error.message);
    }

    throw error;
  }
});

export { createReview };
