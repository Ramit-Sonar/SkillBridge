/**
 * Master reusable Job Details component used in Browse Jobs, My Applications,
 * Manage Jobs, Admin Jobs, and Projects. Only action buttons differ per context.
 */
import { type ElementType, type ReactNode } from "react";
import {
  Tag,
  Clock,
  Calendar,
  SlidersHorizontal,
  FileText,
  Layout,
  Paintbrush,
  Monitor,
  Cpu,
  Globe,
  Search,
} from "lucide-react";
import { ClientInformationCard } from "./ClientInformationCard";
import { type FileAttachment } from "../../../utils/fileUtils";
import { FileAttachmentCard } from "./FileAttachmentCard";
import {
  JOB_CATEGORY_LABELS,
  JOB_DURATION_LABELS,
  JOB_SKILL_COLORS,
} from "../../../constants/job.constants";
import { StatusBadge, type StatusBadgeConfig } from "./ui";

// Category visuals are centralized so every job details surface uses the same badges.

const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  "web-dev": {
    label: JOB_CATEGORY_LABELS["web-dev"],
    icon: Globe,
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  "ui-ux": {
    label: JOB_CATEGORY_LABELS["ui-ux"],
    icon: Layout,
    color: "#14B8A6",
    bg: "#F0FDFA",
    border: "#99F6E4",
  },
  graphic: {
    label: JOB_CATEGORY_LABELS.graphic,
    icon: Paintbrush,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  documentation: {
    label: JOB_CATEGORY_LABELS.documentation,
    icon: FileText,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
  },
  presentation: {
    label: JOB_CATEGORY_LABELS.presentation,
    icon: Monitor,
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  other: {
    label: JOB_CATEGORY_LABELS.other,
    icon: Cpu,
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
  },
};

// Shared shape accepted by every job details context.

export type AttachedFile = FileAttachment;
export type JobDisplayStatus = "open" | "closed" | "cancelled" | "suspended";

export interface JobDetailData {
  title: string;
  category: string;
  status?: JobDisplayStatus;
  description: string;
  requirements?: string;
  skills: string[];
  budget: string;
  duration?: string;
  deadline?: string;
  complexity?: string; // "small" | "medium"
  postedAt?: string;
  recommended?: boolean;
  attachedFiles?: AttachedFile[];
  // Client info (omit for client's own dashboard view)
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
  clientProjectsCompleted?: number;
  clientJoinedDate?: string;
  clientRating?: number;
}

const JOB_STATUS_CFG: Record<JobDisplayStatus, StatusBadgeConfig> = {
  open: {
    label: "Open",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
  closed: {
    label: "Closed",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
    dot: "#94A3B8",
  },
  cancelled: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
  },
  suspended: {
    label: "Suspended",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
  },
};

// Unknown categories still render with a neutral searchable label.

function CategoryBadge({ category }: { category: string }) {
  const categoryConfig = CATEGORY_CONFIG[category];
  if (categoryConfig) {
    const Icon = categoryConfig.icon;
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
        style={{
          background: categoryConfig.bg,
          color: categoryConfig.color,
          borderColor: categoryConfig.border,
          fontSize: "0.65rem",
          fontWeight: 700,
        }}
      >
        <Icon className="w-3 h-3" />
        {categoryConfig.label}
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-blue-50 border-blue-200"
      style={{ color: "#2563EB", fontSize: "0.65rem", fontWeight: 700 }}
    >
      <Search className="w-3 h-3" />
      {category}
    </div>
  );
}

interface Props {
  job: JobDetailData;
  /** Action buttons rendered in the sticky footer */
  actions?: ReactNode;
  /** Set false for client's own Manage Jobs panel */
  showClientCard?: boolean;
  /** Enables the student-facing dummy report action on the client card. */
  showClientReportAction?: boolean;
}

export function SharedJobDetailsContent({
  job,
  actions,
  showClientCard = true,
  showClientReportAction = false,
}: Props) {
  const durLabel =
    JOB_DURATION_LABELS[job.duration as keyof typeof JOB_DURATION_LABELS] ?? job.duration;

  const detailItems = [
    {
      label: "Budget",
      value: `Rs. ${job.budget}`,
      icon: Tag,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    durLabel
      ? {
          label: "Duration",
          value: durLabel,
          icon: Clock,
          color: "#14B8A6",
          bg: "#F0FDFA",
        }
      : null,
    job.deadline
      ? {
          label: "Deadline",
          value: job.deadline,
          icon: Calendar,
          color: "#D97706",
          bg: "#FFFBEB",
        }
      : null,
    job.complexity
      ? {
          label: "Complexity",
          value: job.complexity === "small" ? "Small Task" : "Medium Task",
          icon: SlidersHorizontal,
          color: "#7C3AED",
          bg: "#F5F3FF",
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    value: string;
    icon: ElementType;
    color: string;
    bg: string;
  }[];

  const hasFiles = job.attachedFiles && job.attachedFiles.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Category + title */}
        <div className="flex flex-col gap-2">
          {job.recommended && (
            <div
              className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 font-bold px-2 py-0.5 rounded-full w-fit"
              style={{ fontSize: "0.58rem" }}
            >
              Recommended
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={job.category} />
            {job.status && (
              <StatusBadge
                config={JOB_STATUS_CFG[job.status]}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold"
                style={{ fontSize: "0.65rem" }}
              />
            )}
          </div>
          <h2
            className="text-slate-900 leading-snug"
            style={{ fontSize: "1.05rem", fontWeight: 800 }}
          >
            {job.title}
          </h2>
          {job.postedAt && (
            <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
              Posted {job.postedAt}
            </p>
          )}
        </div>

        {/* Key details grid */}
        {detailItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {detailItems.map((d) => (
              <div
                key={d.label}
                className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-black/[0.04]"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: d.bg }}
                >
                  <d.icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                </div>
                <div>
                  <p className="text-slate-400" style={{ fontSize: "0.62rem", fontWeight: 600 }}>
                    {d.label}
                  </p>
                  <p className="text-slate-900 font-semibold" style={{ fontSize: "0.75rem" }}>
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Job Description */}
        {job.description && (
          <div>
            <p className="text-slate-900 font-bold mb-2" style={{ fontSize: "0.82rem" }}>
              Job Description
            </p>
            <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.8rem" }}>
              {job.description}
            </p>
          </div>
        )}

        {/* Required Skills */}
        {job.skills.length > 0 && (
          <div>
            <p className="text-slate-900 font-bold mb-2.5" style={{ fontSize: "0.82rem" }}>
              Required Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => {
                const skillColor = JOB_SKILL_COLORS[index % JOB_SKILL_COLORS.length];
                return (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-lg font-semibold"
                    style={{
                      background: skillColor.bg,
                      color: skillColor.color,
                      fontSize: "0.65rem",
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Client Requirements */}
        {job.requirements && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-slate-900 font-bold mb-1.5" style={{ fontSize: "0.82rem" }}>
              Client Requirements
            </p>
            <p className="text-slate-500 leading-relaxed" style={{ fontSize: "0.78rem" }}>
              {job.requirements}
            </p>
          </div>
        )}

        {/* Attached Files */}
        <div>
          <p className="text-slate-900 font-bold mb-2.5" style={{ fontSize: "0.82rem" }}>
            Attached Files
          </p>
          {hasFiles ? (
            <div className="flex flex-col gap-2">
              {job.attachedFiles!.map((f) => (
                <FileAttachmentCard key={`${f.originalName}-${f.url}`} attachment={f} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-5">
              <FileText className="w-5 h-5 text-slate-300" />
              <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                No attachment available.
              </p>
            </div>
          )}
        </div>

        {/* Client Information Card */}
        {showClientCard && job.clientName && (
          <ClientInformationCard
            client={{
              id: job.clientId,
              fullName: job.clientName,
              avatar: job.clientAvatar,
              location: job.clientLocation,
              companyName: job.clientCompanyName,
              website: job.clientWebsite,
              joined: job.clientJoinedDate,
              bio: job.clientAbout,
              verification: {
                status: job.clientVerified ? "approved" : null,
              },
              statistics: {
                jobsPosted: job.clientJobsPosted,
                projectsCompleted: job.clientProjectsCompleted,
                averageRating: job.clientRating,
              },
            }}
            showReportAction={showClientReportAction}
          />
        )}
      </div>

      {/* Sticky footer keeps context-specific actions visible while details scroll. */}
      {actions && (
        <div className="p-4 border-t border-black/[0.05] flex gap-3 shrink-0">{actions}</div>
      )}
    </div>
  );
}
