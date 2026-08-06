import { Review } from "../models/review.model.js";
import {
  buildReviewSummary,
  buildStudentReviewSummary,
  canReviewProject,
  getStudentRatingSummary as getStudentRatingSummaryData,
} from "../services/review.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MONGO_DUPLICATE_KEY_ERROR_CODE } from "../constants.js";

/**
 * Handles client reviews for completed projects and student rating summaries.
 */
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
    if (error?.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
      throw new ApiError(409, "This project has already been reviewed");
    }

    if (error?.name === "ValidationError") {
      throw new ApiError(400, error.message);
    }

    throw error;
  }
});

const getStudentReviews = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can view their reviews");
  }

  const reviews = await Review.find({ student: req.user._id })
    .select("_id project client rating comment createdAt")
    .populate({
      path: "client",
      select: "_id fullName avatar",
    })
    .populate({
      path: "project",
      select: "_id job completedAt",
      populate: {
        path: "job",
        select: "_id title category",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  const reviewSummaries = reviews.map((review) =>
    buildStudentReviewSummary(review)
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reviews: reviewSummaries },
        "Student reviews fetched successfully"
      )
    );
});

const getStudentRatingSummary = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can view their rating summary");
  }

  const ratingSummary = await getStudentRatingSummaryData(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        ratingSummary,
        "Student rating summary fetched successfully"
      )
    );
});

export { createReview, getStudentRatingSummary, getStudentReviews };
