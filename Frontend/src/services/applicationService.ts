import type { ClientSummary, JobAttachment } from "./jobService";
import type { ProjectProfileCompletedProject } from "./projectService";
import type { StudentRatingSummary, StudentReviewSummary } from "./reviewService";
import type { StudentCertificate } from "./studentProfileService";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

/**
 * Application service owns student application and client applicant-review API calls.
 */
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type ApplicationJobStatus = "open" | "closed" | "cancelled" | "suspended";

export type ApplicationAttachment = JobAttachment;

export type ApplicationPayload = {
  coverLetter: string;
  estimatedCompletionTime: string;
  whySuitable: string;
  files?: File[];
};

export type ApplicationSubmitResponse = {
  applicationId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
};

export type ApplicationSummaryJob = {
  jobId: string;
  title: string;
  budget: number | string;
  jobType: string;
  status: ApplicationJobStatus;
  clientName: string;
};

export type ApplicationCard = {
  applicationId: string;
  status: ApplicationStatus;
  appliedAt: string;
  job: ApplicationSummaryJob | null;
};

export type ApplicationSummary = ApplicationCard;

export type MyApplicationsResponse = {
  totalApplications: number;
  applications: ApplicationCard[];
};

export type StudentSummary = {
  studentId: string;
  fullName: string;
  avatar?: string;
  profileCompleted?: boolean;
  statistics?: StudentRatingSummary & {
    completedProjectsCount: number;
  };
  verification: {
    status: string | null;
    verifiedAt: string | null;
  };
  profile: {
    bio?: string;
    education: string;
    university: string;
    skills: string[];
    github?: string;
    linkedin?: string;
    portfolio: string;
    certificates?: StudentCertificate[];
  };
  completedProjects?: ProjectProfileCompletedProject[];
  latestReviews?: StudentReviewSummary[];
};

export type ApplicantCard = {
  applicationId: string;
  status: ApplicationStatus;
  appliedAt: string;
  student: StudentSummary | null;
};

export type JobApplicationsResponse = {
  totalApplications: number;
  applicants: ApplicantCard[];
};

export type ApplicationDetailsJob = {
  jobId: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  skills: string[];
  budget: number | string;
  duration: string;
  deadline: string;
  complexity?: "small" | "medium";
  attachments: ApplicationAttachment[];
  status: ApplicationJobStatus;
  createdAt: string;
  client: ClientSummary | null;
};

export type ApplicationDetails = {
  applicationId: string;
  status: ApplicationStatus;
  appliedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
  coverMessage: string;
  estimatedCompletionTime: string;
  whySuitable: string;
  attachments: ApplicationAttachment[];
  job: ApplicationDetailsJob | null;
  student: StudentSummary | null;
};

export type ApplicationActionResponse = {
  applicationId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  withdrawnAt?: string | null;
};

export type WithdrawApplicationResponse = ApplicationActionResponse & {
  withdrawnAt: string;
};

export type AcceptApplicationResponse = ApplicationActionResponse & {
  acceptedAt: string;
  rejectedApplicationsCount: number;
  job: {
    jobId: string;
    status: ApplicationJobStatus;
  };
  project: {
    projectId: string;
    status: "active";
    startedAt: string;
  };
};

export type RejectApplicationResponse = ApplicationActionResponse & {
  rejectedAt: string;
};

export type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

const parseApplicationResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  const data = (await response.json()) as ApiResponse<T>;

  // Preserve backend error messages while keeping a stable fallback for UI copy.
  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const submitApplication = async (
  jobId: string,
  payload: ApplicationPayload
): Promise<ApiResponse<ApplicationSubmitResponse>> => {
  const formData = new FormData();

  // Applications use multipart data so proposal attachments travel with the form.
  formData.append("coverLetter", payload.coverLetter);
  formData.append("estimatedCompletionTime", payload.estimatedCompletionTime);
  formData.append("whySuitable", payload.whySuitable);

  payload.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/applications/${jobId}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseApplicationResponse<ApplicationSubmitResponse>(
    response,
    "Failed to submit application."
  );
};

export const getMyApplications = async (): Promise<ApiResponse<MyApplicationsResponse>> => {
  const response = await fetch(`${API_URL}/applications/my-applications`, {
    method: "GET",
    credentials: "include",
  });

  return parseApplicationResponse<MyApplicationsResponse>(
    response,
    "Failed to fetch applications."
  );
};

export const getApplicationById = async (
  applicationId: string
): Promise<ApiResponse<ApplicationDetails>> => {
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseApplicationResponse<ApplicationDetails>(response, "Failed to fetch application.");
};

export const getJobApplications = async (
  jobId: string
): Promise<ApiResponse<JobApplicationsResponse>> => {
  const response = await fetch(`${API_URL}/applications/job/${jobId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseApplicationResponse<JobApplicationsResponse>(
    response,
    "Failed to fetch job applications."
  );
};

export const withdrawApplication = async (
  applicationId: string
): Promise<ApiResponse<WithdrawApplicationResponse>> => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/withdraw`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseApplicationResponse<WithdrawApplicationResponse>(
    response,
    "Failed to withdraw application."
  );
};

export const acceptApplication = async (
  applicationId: string
): Promise<ApiResponse<AcceptApplicationResponse>> => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/accept`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseApplicationResponse<AcceptApplicationResponse>(
    response,
    "Failed to accept application."
  );
};

export const rejectApplication = async (
  applicationId: string
): Promise<ApiResponse<RejectApplicationResponse>> => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/reject`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseApplicationResponse<RejectApplicationResponse>(
    response,
    "Failed to reject application."
  );
};
