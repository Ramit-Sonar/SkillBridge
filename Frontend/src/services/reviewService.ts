import type { ApiResponse } from "./applicationService";
import { getApiBaseUrl } from "./apiConfig";

const API_URL = getApiBaseUrl();

/**
 * Review service reads student reputation data and creates completed-project reviews.
 */
export type CreateReviewPayload = {
  rating: number;
  comment?: string;
};

export type ReviewSummary = {
  reviewId: string;
  projectId: string;
  studentId: string;
  clientId: string;
  rating: number;
  comment: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentReviewClientSummary = {
  _id: string;
  fullName: string;
  avatar: string;
};

export type StudentReviewJobSummary = {
  _id: string;
  title: string;
  category: string;
};

export type StudentReviewProjectSummary = {
  _id: string;
  completedAt: string | null;
  job: StudentReviewJobSummary | null;
};

export type StudentReviewSummary = {
  reviewId: string;
  rating: number;
  comment: string;
  createdAt: string;
  client: StudentReviewClientSummary | null;
  project: StudentReviewProjectSummary | null;
};

export type StudentReviewsResponse = {
  reviews: StudentReviewSummary[];
};

export type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type StudentRatingSummary = {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: RatingDistribution;
};

const parseReviewResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const createReview = async (
  projectId: string,
  payload: CreateReviewPayload
): Promise<ApiResponse<ReviewSummary>> => {
  const response = await fetch(`${API_URL}/reviews/projects/${projectId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseReviewResponse<ReviewSummary>(response, "Failed to create review.");
};

export const getStudentReviews = async (): Promise<ApiResponse<StudentReviewsResponse>> => {
  const response = await fetch(`${API_URL}/reviews/my-reviews`, {
    method: "GET",
    credentials: "include",
  });

  return parseReviewResponse<StudentReviewsResponse>(response, "Failed to fetch reviews.");
};

export const getStudentRatingSummary = async (): Promise<ApiResponse<StudentRatingSummary>> => {
  const response = await fetch(`${API_URL}/reviews/my-rating-summary`, {
    method: "GET",
    credentials: "include",
  });

  return parseReviewResponse<StudentRatingSummary>(response, "Failed to fetch rating summary.");
};
