import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";

const emptyRatingDistribution = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

const canReviewProject = async (projectId, clientId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  if (!mongoose.isValidObjectId(clientId)) {
    throw new ApiError(400, "Invalid client id");
  }

  const project = await Project.findById(projectId)
    .select("_id student client status")
    .lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.client.toString() !== clientId.toString()) {
    throw new ApiError(403, "You can review only your own project");
  }

  if (project.status !== "completed") {
    throw new ApiError(400, "Only completed projects can be reviewed");
  }

  const existingReview = await Review.exists({ project: project._id });

  if (existingReview) {
    throw new ApiError(409, "This project has already been reviewed");
  }

  return project;
};

const getStudentRatingSummary = async (studentId) => {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, "Invalid student id");
  }

  const [summary] = await Review.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
      },
    },
    {
      $group: {
        _id: "$student",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
        oneStar: {
          $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
        },
        twoStar: {
          $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
        },
        threeStar: {
          $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
        },
        fourStar: {
          $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
        },
        fiveStar: {
          $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
        },
      },
    },
  ]);

  if (!summary) {
    return {
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: { ...emptyRatingDistribution },
    };
  }

  return {
    averageRating: Number(summary.averageRating.toFixed(1)),
    reviewCount: summary.reviewCount,
    ratingDistribution: {
      1: summary.oneStar,
      2: summary.twoStar,
      3: summary.threeStar,
      4: summary.fourStar,
      5: summary.fiveStar,
    },
  };
};

const buildReviewSummary = (review) => ({
  reviewId: review._id,
  projectId: review.project,
  studentId: review.student,
  clientId: review.client,
  rating: review.rating,
  comment: review.comment || "",
  editedAt: review.editedAt,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

export { buildReviewSummary, canReviewProject, getStudentRatingSummary };
