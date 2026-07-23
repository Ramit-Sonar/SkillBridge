import type { ApiResponse } from "./applicationService";
import type { JobAttachment } from "./jobService";
import type { StudentRatingSummary, StudentReviewSummary } from "./reviewService";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

/**
 * Project service mirrors the project workspace API contract used by both roles.
 */
export type ProjectStatus = "active" | "submitted" | "revision_requested" | "completed";

export type ProjectPerson = {
  name: string;
  initials: string;
  avatar: string;
};

export type ProjectSummarySubmission = {
  versionNumber: number;
  submittedAt: string;
  status: "submitted" | "approved";
  demoLink?: string;
  repositoryLink?: string;
  liveUrl?: string;
};

export type ProjectSummary = {
  id: string;
  title: string;
  status: ProjectStatus;
  category: string;
  description?: string;
  skills?: string[];
  student: ProjectPerson | null;
  client: ProjectPerson | null;
  deadline: string;
  budget: string;
  revisionCount: number;
  completedAt?: string | null;
  lastUpdated: string;
  currentAction: string;
  submissions: ProjectSummarySubmission[];
};

export type ProjectProfileLatestSubmission = {
  id?: string;
  versionNumber: number;
  submittedAt: string;
  status: "submitted" | "approved";
  demoLink: string;
  repositoryLink: string;
  liveUrl: string;
};

export type ProjectProfileCompletedProject = {
  projectId: string;
  status: ProjectStatus;
  completedAt: string | null;
  job: {
    jobId: string;
    title: string;
    category: string;
    description: string;
    skills: string[];
  } | null;
  client: {
    clientId: string;
    fullName: string;
    avatar: string;
  } | null;
  latestSubmission: ProjectProfileLatestSubmission | null;
};

export type MyProjectsResponse = {
  totalProjects: number;
  projects: ProjectSummary[];
};

export type ProjectStatusSummary = {
  id: string;
  status: ProjectStatus;
  startedAt?: string;
  completedAt?: string | null;
  lastActivityAt?: string;
  hasReview?: boolean;
};

export type ProjectPartner = {
  id: string;
  role: "student" | "client";
  fullName: string;
  avatar: string;
  companyName?: string;
  headline?: string;
  verifiedBadge?: boolean;
};

export type ProjectWorkspaceJob = {
  id: string;
  title: string;
  category: string;
  status: string;
  description: string;
  requirements: string;
  skills: string[];
  budget: number | string;
  duration: string;
  deadline: string;
  complexity?: "small" | "medium";
  postedAt: string;
  attachedFiles: JobAttachment[];
  clientId?: string;
  clientName?: string;
  clientInitials?: string;
  clientAvatar?: string;
  clientLocation?: string;
  clientCompanyName?: string;
  clientWebsite?: string;
  clientAbout?: string;
  clientVerified?: boolean;
  clientJobsPosted?: number;
  clientProjectsCompleted?: number | null;
  clientJoinedDate?: string;
  clientRating?: number | null;
};

export type ProjectWorkspaceApplication = {
  id: string;
  status: string;
  coverMessage: string;
  estimatedTime: string;
  whySuitable: string;
  attachments: JobAttachment[];
  appliedAt: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  withdrawnAt?: string | null;
  updatedAt: string;
};

export type ProjectStudentProfile = {
  id: string;
  name: string;
  initials: string;
  headline: string;
  education: string;
  university: string;
  bio: string;
  verified: boolean;
  skills: {
    name: string;
    verified: boolean;
  }[];
  github: string;
  linkedin: string;
  portfolio: string;
  statistics?: StudentRatingSummary & {
    completedProjectsCount: number;
  };
  completedProjects?: ProjectProfileCompletedProject[];
  latestReviews?: StudentReviewSummary[];
  avatarUrl: string;
};

export type ProjectWorkspace = {
  project: ProjectStatusSummary;
  overview: ProjectStatusSummary & {
    partner: ProjectPartner | null;
  };
  job: ProjectWorkspaceJob | null;
  application: ProjectWorkspaceApplication | null;
  studentProfile: ProjectStudentProfile | null;
};

export type ProjectRevisionSummary = {
  id: string;
  revisionNumber: number;
  requestedAt: string;
  resolved: boolean;
  resolvedAt?: string | null;
};

export type ProjectDeliverable = {
  id: string;
  versionNumber: number;
  label: string;
  notes: string;
  demoLink: string;
  repositoryLink: string;
  liveUrl: string;
  attachments: JobAttachment[];
  submittedAt: string;
  status: "submitted" | "approved";
  approvedAt?: string | null;
  relatedRevision?: ProjectRevisionSummary | null;
};

export type ProjectDeliverableHistoryItem = {
  id: string;
  versionNumber: number;
  label: string;
  status: "submitted" | "approved";
  submittedAt: string;
};

export type ProjectDeliverablesResponse = {
  project: {
    id: string;
    status: ProjectStatus;
    canSubmit: boolean;
  };
  currentDeliverable: ProjectDeliverable | null;
  history: ProjectDeliverableHistoryItem[];
  currentRevisionRequest: ProjectRevisionRequest | null;
};

export type ProjectTimelineActor = {
  id: string;
  fullName?: string;
  avatar?: string;
};

export type ProjectTimelineEvent = {
  type: string;
  message: string;
  actor: ProjectTimelineActor | null;
  createdAt: string;
  referenceType?: string;
  referenceId?: string;
};

export type ProjectTimelineResponse = {
  timeline: ProjectTimelineEvent[];
};

export type SubmitDeliverablePayload = {
  notes: string;
  demoLink?: string;
  repositoryLink?: string;
  liveUrl?: string;
  files?: File[];
};

export type SubmitDeliverableResponse = {
  project: ProjectStatusSummary;
  latestSubmission: ProjectDeliverable;
};

export type RequestRevisionPayload = {
  message: string;
  referenceLinks?: string[];
  files?: File[];
};

export type ProjectRevisionRequest = {
  id: string;
  revisionNumber: number;
  requestedBy: ProjectPerson | null;
  requestedAt: string;
  message: string;
  attachments: JobAttachment[];
  referenceLinks: string[];
  resolved: boolean;
  resolvedAt?: string | null;
};

export type RequestRevisionResponse = {
  project: {
    id: string;
    status: ProjectStatus;
    lastActivityAt: string;
  };
  revision: ProjectRevisionRequest | null;
};

export type ApproveDeliverableResponse = {
  project: {
    id: string;
    status: ProjectStatus;
    completedAt: string;
    lastActivityAt: string;
  };
};

const parseProjectResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  const data = (await response.json()) as ApiResponse<T>;

  // Keep response parsing consistent across project tabs and actions.
  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const getMyProjects = async (): Promise<ApiResponse<MyProjectsResponse>> => {
  const response = await fetch(`${API_URL}/projects/my-projects`, {
    method: "GET",
    credentials: "include",
  });

  return parseProjectResponse<MyProjectsResponse>(response, "Failed to fetch projects.");
};

export const getProjectById = async (projectId: string): Promise<ApiResponse<ProjectWorkspace>> => {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseProjectResponse<ProjectWorkspace>(response, "Failed to fetch project.");
};

export const getProjectDeliverables = async (
  projectId: string
): Promise<ApiResponse<ProjectDeliverablesResponse>> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/deliverables`, {
    method: "GET",
    credentials: "include",
  });

  return parseProjectResponse<ProjectDeliverablesResponse>(
    response,
    "Failed to fetch project deliverables."
  );
};

export const getProjectTimeline = async (
  projectId: string
): Promise<ApiResponse<ProjectTimelineResponse>> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/timeline`, {
    method: "GET",
    credentials: "include",
  });

  return parseProjectResponse<ProjectTimelineResponse>(
    response,
    "Failed to fetch project timeline."
  );
};

export const submitDeliverable = async (
  projectId: string,
  data: SubmitDeliverablePayload
): Promise<ApiResponse<SubmitDeliverableResponse>> => {
  const formData = new FormData();

  // Deliverable URLs and files share one multipart request.
  formData.append("notes", data.notes);
  if (data.demoLink !== undefined) formData.append("demoLink", data.demoLink);
  if (data.repositoryLink !== undefined) formData.append("repositoryLink", data.repositoryLink);
  if (data.liveUrl !== undefined) formData.append("liveUrl", data.liveUrl);

  data.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/projects/${projectId}/deliverables`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseProjectResponse<SubmitDeliverableResponse>(response, "Failed to submit deliverable.");
};

export const requestRevision = async (
  projectId: string,
  data: RequestRevisionPayload
): Promise<ApiResponse<RequestRevisionResponse>> => {
  const formData = new FormData();

  // Reference links are serialized because they are optional alongside file uploads.
  formData.append("message", data.message);

  if (data.referenceLinks !== undefined) {
    formData.append("referenceLinks", JSON.stringify(data.referenceLinks));
  }

  data.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/projects/${projectId}/deliverables/request-revision`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseProjectResponse<RequestRevisionResponse>(response, "Failed to request revision.");
};

export const approveDeliverable = async (
  projectId: string
): Promise<ApiResponse<ApproveDeliverableResponse>> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/deliverables/approve`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseProjectResponse<ApproveDeliverableResponse>(
    response,
    "Failed to approve deliverable."
  );
};
