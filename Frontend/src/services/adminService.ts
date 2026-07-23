import type { ProjectProfileCompletedProject } from "./projectService";
import type { StudentRatingSummary, StudentReviewSummary } from "./reviewService";
import type { ApiResponse } from "./reportService";
import { getApiBaseUrl } from "./apiConfig";

const API_URL = getApiBaseUrl();

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

export type AdminPendingTask = {
  id: string;
  name: string;
  initials: string;
  type: "student" | "client";
  text: string;
  submittedAt: string;
  path: string;
};

export type AdminDashboardSummary = {
  pendingVerifications: number;
  totalStudents: number;
  totalClients: number;
  activeProjects: number;
  pendingTasks: AdminPendingTask[];
};

const parseAdminResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `${fallbackMessage} The API returned a non-JSON response. Please make sure the backend server is running and VITE_API_URL points to the backend API.`
    );
  }

  let data: ApiResponse<T>;

  try {
    data = JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const getAdminDashboardSummary = async (): Promise<ApiResponse<AdminDashboardSummary>> => {
  const response = await fetch(`${API_URL}/admin/dashboard`, {
    method: "GET",
    credentials: "include",
  });

  return parseAdminResponse<AdminDashboardSummary>(response, "Failed to fetch admin dashboard.");
};

export const getUsers = async (): Promise<ApiResponse<UsersResponse>> => {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    credentials: "include",
  });

  return parseAdminResponse<UsersResponse>(response, "Failed to fetch users.");
};

export const getUserDetails = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseAdminResponse<PlatformUser>(response, "Failed to fetch user details.");
};

export const suspendUser = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseAdminResponse<PlatformUser>(response, "Failed to suspend user.");
};

export const activateUser = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}/activate`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseAdminResponse<PlatformUser>(response, "Failed to activate user.");
};
