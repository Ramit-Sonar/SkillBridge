import type { ProjectProfileCompletedProject } from "./projectService";
import type { StudentRatingSummary, StudentReviewSummary } from "./reviewService";
import type { ApiResponse } from "./reportService";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

export type VerificationStatus = "pending" | "approved" | "rejected";
export type UserStatus = "active" | "suspended";
export type UserRole = "student" | "client";

export type PlatformUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  joinedAt: string;
  projectCount: number;
  reportsReceived: number;
  pendingReports: number;
  avatar?: string;
  location?: string;
  headline?: string;
  education?: string;
  university?: string;
  bio: string;
  skills?: { name: string; verified: boolean }[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  ratingSummary?: StudentRatingSummary | null;
  completedProjects?: ProjectProfileCompletedProject[];
  latestReviews?: StudentReviewSummary[];
  companyName?: string;
  website?: string;
  jobsPosted?: number;
  projectsCompleted?: number;
  activeProjects?: number;
};

export type UsersResponse = {
  totalUsers: number;
  users: PlatformUser[];
};

const parseUserManagementResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const getUsers = async (): Promise<ApiResponse<UsersResponse>> => {
  const response = await fetch(`${API_URL}/reports/admin/users`, {
    method: "GET",
    credentials: "include",
  });

  return parseUserManagementResponse<UsersResponse>(response, "Failed to fetch users.");
};

export const getUserDetails = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/reports/admin/users/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseUserManagementResponse<PlatformUser>(response, "Failed to fetch user details.");
};

export const suspendUser = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/reports/admin/users/${userId}/suspend`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseUserManagementResponse<PlatformUser>(response, "Failed to suspend user.");
};

export const activateUser = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/reports/admin/users/${userId}/activate`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseUserManagementResponse<PlatformUser>(response, "Failed to activate user.");
};
