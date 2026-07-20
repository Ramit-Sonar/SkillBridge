/**
 * Shared frontend domain types used across job browsing and detail views.
 */
export type JobCategoryId =
  | "web-dev"
  | "ui-ux"
  | "graphic"
  | "documentation"
  | "presentation"
  | "other";

export type JobDurationId = "1d" | "3d" | "5d" | "7d" | "14d" | "custom";

export type JobComplexity = "small" | "medium";

export type JobStatus = "open" | "closed" | "cancelled";

export interface BrowseJob {
  id: string;
  title: string;
  category: JobCategoryId;
  status?: JobStatus;
  description: string;
  skills: string[];
  budget: string;
  duration: JobDurationId;
  deadline: string;
  complexity: JobComplexity;
  recommended?: boolean;
  postedAt: string;
  requirements?: string;
}
