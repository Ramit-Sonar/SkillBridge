import type { PlatformUser } from "./adminService";
import { getApiBaseUrl } from "./apiConfig";

const API_URL = getApiBaseUrl();

export type ReportReason =
  "Scam / Fraud" | "Fake Profile" | "Harassment" | "Spam" | "Inappropriate Behavior" | "Other";

export type ReportStatus = "pending" | "resolved" | "dismissed";

export type ReportUserRole = "student" | "client" | "user";

export type ReportAttachment = {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type ReportUserSummary = {
  id: string;
  fullName: string;
  name: string;
  initials: string;
  email: string;
  role: ReportUserRole;
  avatar?: string;
  accountStatus?: "active" | "suspended";
  profileCompleted?: boolean;
};

export type UserReport = {
  id: string;
  reportId?: string;
  reporterUserId: string;
  reporterName: string;
  reporterInitials: string;
  reporterAvatar?: string;
  reporterRole: ReportUserRole;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserRole: ReportUserRole;
  reason: string;
  description: string;
  attachments?: ReportAttachment[];
  status: ReportStatus;
  submittedAt: string;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reporter?: ReportUserSummary | null;
  reportedUser?: ReportUserSummary | null;
  handledBy?: ReportUserSummary | null;
};

export type SubmitReportPayload = {
  reportedUserId?: string;
  reportedUserName: string;
  reportedUserRole: ReportUserRole;
  reason: string;
  description: string;
  files?: File[];
};

export type ReportsResponse = {
  totalReports: number;
  reports: UserReport[];
};

export type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

const parseReportResponse = async <T>(
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

export const submitReport = async (
  payload: SubmitReportPayload
): Promise<ApiResponse<UserReport>> => {
  if (!payload.reportedUserId) {
    throw new Error("Reported user id is required.");
  }

  const formData = new FormData();

  formData.append("reportedUserId", payload.reportedUserId);
  formData.append("reason", payload.reason);
  formData.append("description", payload.description);

  payload.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/reports`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseReportResponse<UserReport>(response, "Failed to submit report.");
};

export const getReports = async (params?: {
  status?: ReportStatus | "all";
  search?: string;
}): Promise<ApiResponse<ReportsResponse>> => {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params?.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  const query = searchParams.toString();
  const response = await fetch(`${API_URL}/reports${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
  });

  return parseReportResponse<ReportsResponse>(response, "Failed to fetch reports.");
};

export const getReportById = async (reportId: string): Promise<ApiResponse<UserReport>> => {
  const response = await fetch(`${API_URL}/reports/${reportId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseReportResponse<UserReport>(response, "Failed to fetch report.");
};

export const getReportedUserDetails = async (
  userId: string
): Promise<ApiResponse<PlatformUser>> => {
  const response = await fetch(`${API_URL}/reports/users/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseReportResponse<PlatformUser>(response, "Failed to fetch reported user details.");
};

export const resolveReport = async (reportId: string): Promise<ApiResponse<UserReport>> => {
  const response = await fetch(`${API_URL}/reports/${reportId}/resolve`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseReportResponse<UserReport>(response, "Failed to resolve report.");
};

export const dismissReport = async (reportId: string): Promise<ApiResponse<UserReport>> => {
  const response = await fetch(`${API_URL}/reports/${reportId}/dismiss`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseReportResponse<UserReport>(response, "Failed to dismiss report.");
};
