import type { LucideIcon } from "lucide-react";
import type { TimelineTone } from "../components/shared/Timeline";

// Shared project view types used by both student and client workspaces.
export type ProjectStatus = "active" | "submitted" | "revision_requested" | "completed";

export type ProjectSubmissionStatus = "submitted" | "revision_requested" | "approved";

export interface ProjectFile {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ProjectPerson {
  name: string;
  initials: string;
  avatar?: string;
}

export interface ProjectSubmission {
  id: string;
  versionNumber: number;
  label?: string;
  status: ProjectSubmissionStatus;
  submittedAt: string;
  notes?: string;
  demoLink?: string;
  repositoryLink?: string;
  liveUrl?: string;
  attachments?: ProjectFile[];
  approvedAt?: string | null;
}

export interface RevisionRequest {
  id: string;
  revisionNumber: number;
  requestedBy: ProjectPerson | null;
  requestedAt: string;
  message: string;
  attachments: ProjectFile[];
  referenceLinks: string[];
  resolved: boolean;
  resolvedAt?: string | null;
}

export interface ProjectTimelineItem {
  key: string;
  label: string;
  description?: string;
  actor?: string;
  date: string;
  fullDate?: string;
  tone: TimelineTone;
  icon?: LucideIcon;
}

export const PROJECT_STATUS_CFG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#3B82F6",
  },
  submitted: {
    label: "Submitted",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#8B5CF6",
  },
  revision_requested: {
    label: "Revision",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
};
