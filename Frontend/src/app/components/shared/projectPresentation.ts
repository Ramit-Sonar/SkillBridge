import type { ProjectStatus, ProjectSubmissionStatus } from "../../data/projects";

export type ProjectViewerRole = "student" | "client";

const PROJECT_SUBMISSION_STATUS_LABELS: Record<ProjectSubmissionStatus, string> = {
  submitted: "Submitted",
  revision_requested: "Needs revision",
  approved: "Approved",
};

const PROJECT_SUBMISSION_TITLE_LABELS: Record<ProjectSubmissionStatus, string> = {
  submitted: "Submitted",
  revision_requested: "Needs Revision",
  approved: "Approved",
};

const PROJECT_SUBMISSION_BADGE_LABELS: Record<ProjectSubmissionStatus, string> = {
  submitted: "Submitted",
  revision_requested: "Revision Requested",
  approved: "Approved",
};

/**
 * Shared project text helpers keep list cards and workspace headers consistent.
 */
export function formatProjectRelativeDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  const today = new Date();
  const diffMs = today.getTime() - parsedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getProjectCardAction(
  status: ProjectStatus,
  role: ProjectViewerRole,
  hasSubmissions: boolean
) {
  if (status === "completed") return "Project completed";

  if (status === "submitted") {
    return role === "client" ? "Review latest submission" : "Waiting for client review";
  }

  if (status === "revision_requested") {
    return role === "student" ? "Client requested revisions" : "Waiting for student resubmission";
  }

  if (role === "student") {
    return hasSubmissions ? "Continue project work" : "Submit first deliverables";
  }

  return "Waiting for student submission";
}

export function getProjectOverviewAction(status: ProjectStatus, role: ProjectViewerRole) {
  if (status === "completed") return "Project Completed";

  if (status === "submitted") {
    return role === "client" ? "Review Deliverables" : "Waiting for Client Review";
  }

  if (status === "revision_requested") {
    return role === "student" ? "Revision Requested" : "Waiting for Student Resubmission";
  }

  return role === "student" ? "Submit Deliverables" : "Waiting for Student Submission";
}

export function getProjectStateText(status: ProjectStatus) {
  if (status === "submitted") return "Waiting for Client Review";
  if (status === "revision_requested") return "Revision Requested";
  if (status === "completed") return "Project Completed";

  return "In Progress";
}

export function getProjectSubmissionStatusLabel(status: ProjectSubmissionStatus) {
  return PROJECT_SUBMISSION_STATUS_LABELS[status];
}

export function getProjectSubmissionStatusTitleLabel(status: ProjectSubmissionStatus) {
  return PROJECT_SUBMISSION_TITLE_LABELS[status];
}

export function getProjectSubmissionStatusBadgeLabel(status: ProjectSubmissionStatus) {
  return PROJECT_SUBMISSION_BADGE_LABELS[status];
}
