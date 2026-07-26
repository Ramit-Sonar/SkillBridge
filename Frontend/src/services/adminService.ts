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
  suspendedAt?: string | null;
  suspendedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  suspensionReason?: string;
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

export type AdminJobStatus = "open" | "closed" | "cancelled" | "suspended";

export type JobModerationReason =
  | "Spam"
  | "Fake Job"
  | "Duplicate Listing"
  | "Policy Violation"
  | "Copyright Issue"
  | "Other";

export type AdminJobClient = {
  id: string;
  name: string;
  fullName?: string;
  initials: string;
  avatar?: string;
  joined?: string | null;
  location?: string;
  companyName?: string;
  website?: string;
  bio?: string;
  verification?: {
    status: string | null;
    verifiedAt?: string | null;
  };
  statistics?: {
    jobsPosted?: number | null;
    projectsCompleted?: number | null;
    activeProjects?: number | null;
    totalReviews?: number | null;
    averageRating?: number | null;
  };
};

export type AdminJobApplication = {
  id: string;
  student?: {
    id: string;
    name: string;
    initials: string;
    avatar?: string;
  } | null;
  status: string;
  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminJob = {
  id: string;
  _id?: string;
  title: string;
  client?: AdminJobClient;
  clientName?: string;
  clientInitials?: string;
  clientAvatar?: string;
  clientId?: string;
  clientLocation?: string;
  clientCompanyName?: string;
  clientWebsite?: string;
  clientAbout?: string;
  clientVerified?: boolean;
  clientJobsPosted?: number | null;
  clientProjectsCompleted?: number | null;
  clientJoinedDate?: string | null;
  clientRating?: number | null;
  category: string;
  budget: number | string;
  duration: string;
  deadline: string;
  complexity: "small" | "medium";
  status: AdminJobStatus;
  moderatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  moderatedAt?: string | null;
  moderationReason?: string;
  customModerationReason?: string;
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  applications?: number | AdminJobApplication[];
  applicationCount?: number;
  applicationsCount?: number;
  description: string;
  requirements: string;
  skills: string[];
  attachments?: {
    url: string;
    publicId?: string;
    originalName: string;
    mimeType: string;
    size: number;
  }[];
};

export type AdminJobsResponse = {
  totalJobs: number;
  jobs: AdminJob[];
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

export const getAdminJobs = async (params?: {
  search?: string;
  status?: string;
}): Promise<ApiResponse<AdminJobsResponse>> => {
  const searchParams = new URLSearchParams();

  if (params?.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params?.status && params.status !== "All") {
    searchParams.set("status", params.status.toLowerCase());
  }

  const queryString = searchParams.toString();
  const url = queryString ? `${API_URL}/admin/jobs?${queryString}` : `${API_URL}/admin/jobs`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  return parseAdminResponse<AdminJobsResponse>(response, "Failed to fetch jobs.");
};

export const getAdminJobDetails = async (jobId: string): Promise<ApiResponse<AdminJob>> => {
  const response = await fetch(`${API_URL}/admin/jobs/${jobId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseAdminResponse<AdminJob>(response, "Failed to fetch job details.");
};

export const suspendAdminJob = async (
  jobId: string,
  payload: {
    moderationReason: JobModerationReason;
    customModerationReason?: string;
  }
): Promise<ApiResponse<AdminJob>> => {
  const response = await fetch(`${API_URL}/admin/jobs/${jobId}/suspend`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseAdminResponse<AdminJob>(response, "Failed to suspend job.");
};

export const getUserDetails = async (userId: string): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseAdminResponse<PlatformUser>(response, "Failed to fetch user details.");
};

export const suspendUser = async (
  userId: string,
  suspensionReason = ""
): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ suspensionReason }),
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
