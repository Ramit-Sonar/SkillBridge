import type { JobCategoryId, JobDurationId } from "../types";

/**
 * Shared job labels and presentation constants used by job forms and cards.
 */
export const JOB_CATEGORIES: { value: JobCategoryId; label: string }[] = [
  { value: "web-dev", label: "Web Development" },
  { value: "ui-ux", label: "UI/UX Design" },
  { value: "graphic", label: "Graphic Design" },
  { value: "documentation", label: "Documentation" },
  { value: "presentation", label: "Presentation Design" },
  { value: "other", label: "Basic Tech Service" },
];

export const JOB_CATEGORY_LABELS: Record<JobCategoryId, string> = JOB_CATEGORIES.reduce(
  (labels, category) => ({ ...labels, [category.value]: category.label }),
  {} as Record<JobCategoryId, string>
);

export const JOB_DURATION_OPTIONS: { value: JobDurationId; label: string }[] = [
  { value: "1d", label: "1 Day" },
  { value: "3d", label: "3 Days" },
  { value: "5d", label: "5 Days" },
  { value: "7d", label: "7 Days" },
  { value: "14d", label: "14 Days" },
];

export const JOB_DURATION_LABELS: Record<JobDurationId, string> = {
  "1d": "1 Day",
  "3d": "3 Days",
  "5d": "5 Days",
  "7d": "7 Days",
  "14d": "14 Days",
  custom: "Custom",
};

export const JOB_SKILL_COLORS = [
  { bg: "#EFF6FF", color: "#2563EB" },
  { bg: "#F0FDFA", color: "#0D9488" },
  { bg: "#FFFBEB", color: "#D97706" },
  { bg: "#F5F3FF", color: "#7C3AED" },
  { bg: "#FFF1F2", color: "#E11D48" },
  { bg: "#F0FDF4", color: "#16A34A" },
];
