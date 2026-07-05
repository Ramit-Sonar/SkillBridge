import { useState, useMemo, useEffect, type ElementType } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  LayoutGrid,
  List,
  User,
  Clock,
  Calendar,
  Tag,
  ChevronRight,
  Globe,
  Layout,
  Paintbrush,
  FileText,
  Monitor,
  Cpu,
  CheckCircle,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { ApplyModal } from "../../app/components/ApplyModal";
import {
  ClientInformationCard,
  type ClientCardData,
} from "../../app/components/shared/ClientInformationCard";
import { FileAttachmentCard } from "../../app/components/shared/FileAttachmentCard";
import { Notification, type NotificationMessage } from "../../app/components/shared/ui";
import { VerificationReminderCard } from "../../app/components/shared/VerificationReminderCard";
import {
  JOB_CATEGORIES,
  JOB_DURATION_OPTIONS,
  JOB_SKILL_COLORS,
} from "../../constants/job.constants";
import { getAllOpenJobs, getJobById, type JobData } from "../../services/jobService";
import type { BrowseJob, JobCategoryId } from "../../types";
import { type FileAttachment } from "../../utils/fileUtils";

type JobDetailData = BrowseJob & {
  client?: ClientCardData;
  attachedFiles?: FileAttachment[];
};

function formatJobDate(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDeadline(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toISOString().split("T")[0];
}

function formatBudget(budget: string | number) {
  const numericBudget = Number(budget);

  if (Number.isNaN(numericBudget)) return String(budget);

  return numericBudget.toLocaleString("en-IN");
}

function mapJobFromApi(job: JobData): BrowseJob {
  return {
    id: job._id ?? "",
    title: job.title,
    category: job.category as BrowseJob["category"],
    status: job.status,
    description: job.description ?? "",
    skills: job.skills ?? [],
    budget: formatBudget(job.budget),
    duration: job.duration as BrowseJob["duration"],
    deadline: formatDeadline(job.deadline),
    complexity: (job.complexity ?? "small") as BrowseJob["complexity"],
    postedAt: formatJobDate(job.createdAt),
    requirements: job.requirements,
  };
}

function mapJobDetailsFromApi(job: JobData): JobDetailData {
  const client = typeof job.client === "object" && job.client ? job.client : undefined;
  const clientName = client?.fullName?.trim();
  const clientCard =
    client && clientName
      ? {
          ...client,
          fullName: clientName,
          avatar: client.avatar || undefined,
        }
      : undefined;

  const attachments = job.attachments as (FileAttachment | string)[] | undefined;

  return {
    ...mapJobFromApi(job),
    client: clientCard,
    attachedFiles: attachments
      ?.map((attachment) => {
        if (typeof attachment === "string") {
          return {
            url: attachment,
            originalName: attachment,
            mimeType: "application/octet-stream",
            size: 0,
          };
        }

        return attachment;
      })
      .filter((attachment) => Boolean(attachment.originalName)),
  };
}
// Config

const CATEGORY_CONFIG: Record<
  JobCategoryId,
  {
    label: string;
    icon: ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  "web-dev": {
    label: JOB_CATEGORIES[0].label,
    icon: Globe,
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  "ui-ux": {
    label: JOB_CATEGORIES[1].label,
    icon: Layout,
    color: "#14B8A6",
    bg: "#F0FDFA",
    border: "#99F6E4",
  },
  graphic: {
    label: JOB_CATEGORIES[2].label,
    icon: Paintbrush,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  documentation: {
    label: JOB_CATEGORIES[3].label,
    icon: FileText,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
  },
  presentation: {
    label: JOB_CATEGORIES[4].label,
    icon: Monitor,
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  other: {
    label: JOB_CATEGORIES[5].label,
    icon: Cpu,
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
  },
};

const DURATIONS = JOB_DURATION_OPTIONS;

// Small components

function SkillChip({ skill, index }: { skill: string; index: number }) {
  const skillColor = JOB_SKILL_COLORS[index % JOB_SKILL_COLORS.length];
  return (
    <span
      className="px-2 py-0.5 rounded-lg font-semibold shrink-0"
      style={{
        background: skillColor.bg,
        color: skillColor.color,
        fontSize: "0.65rem",
      }}
    >
      {skill}
    </span>
  );
}

function CategoryBadge({ category }: { category: JobCategoryId }) {
  const categoryConfig = CATEGORY_CONFIG[category];
  if (!categoryConfig) return null;
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

// Job Card (grid)

function JobCard({
  job,
  onView,
  selected,
}: {
  job: BrowseJob;
  onView: () => void;
  selected: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
      className={`group relative bg-white rounded-2xl border flex flex-col gap-4 p-5 cursor-pointer transition-shadow duration-300 ${
        selected
          ? "border-blue-600 shadow-lg shadow-blue-100/50"
          : "border-black/[0.06] shadow-sm hover:shadow-xl hover:border-blue-200"
      }`}
      onClick={onView}
    >
      {/* Recommended badge */}
      {job.recommended && (
        <div
          className="absolute -top-2.5 left-4 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 font-bold px-2.5 py-0.5 rounded-full"
          style={{ fontSize: "0.58rem" }}
        >
          Recommended
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start pt-1">
        <CategoryBadge category={job.category} />
      </div>

      {/* Title */}
      <h3
        className="text-slate-900 leading-snug line-clamp-2"
        style={{ fontSize: "0.9rem", fontWeight: 700 }}
      >
        {job.title}
      </h3>

      {/* Description */}
      <p
        className="text-slate-500 leading-relaxed line-clamp-2 flex-1"
        style={{ fontSize: "0.78rem" }}
      >
        {job.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 3).map((s, i) => (
          <SkillChip key={s} skill={s} index={i} />
        ))}
        {job.skills.length > 3 && (
          <span
            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 font-semibold"
            style={{ fontSize: "0.65rem" }}
          >
            +{job.skills.length - 3}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 pt-1 border-t border-black/[0.04] flex-wrap">
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold" style={{ fontSize: "0.72rem" }}>
            Rs. {job.budget}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500" style={{ fontSize: "0.7rem" }}>
            {DURATIONS.find((d) => d.value === job.duration)?.label}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-slate-400" style={{ fontSize: "0.65rem" }}>
            {job.postedAt}
          </span>
        </div>
      </div>

      {/* View details */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
        className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold py-2.5 rounded-xl transition-colors duration-200 group-hover:bg-blue-50"
        style={{ fontSize: "0.78rem" }}
      >
        View Details
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// Job Card (list)

function JobCardList({
  job,
  onView,
  selected,
}: {
  job: BrowseJob;
  onView: () => void;
  selected: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onView}
      className={`group relative bg-white rounded-2xl border flex items-start gap-5 p-5 cursor-pointer transition-all duration-300 ${
        selected
          ? "border-blue-600 shadow-lg shadow-blue-100/50"
          : "border-black/[0.06] shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-0.5"
      }`}
    >
      {/* Recommended badge */}
      {job.recommended && (
        <div
          className="absolute -top-2.5 left-4 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 font-bold px-2.5 py-0.5 rounded-full"
          style={{ fontSize: "0.58rem" }}
        >
          Recommended
        </div>
      )}

      {/* Left: content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={job.category} />
          <span className="text-slate-400" style={{ fontSize: "0.65rem" }}>
            {job.postedAt}
          </span>
        </div>
        <h3
          className="text-slate-900 leading-snug"
          style={{ fontSize: "0.95rem", fontWeight: 700 }}
        >
          {job.title}
        </h3>
        <p className="text-slate-500 leading-relaxed line-clamp-2" style={{ fontSize: "0.78rem" }}>
          {job.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s, i) => (
            <SkillChip key={s} skill={s} index={i} />
          ))}
          {job.skills.length > 4 && (
            <span
              className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 font-semibold"
              style={{ fontSize: "0.65rem" }}
            >
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Right: meta + actions */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="text-right flex flex-col gap-1">
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
            Rs. {job.budget}
          </p>
          <p className="text-slate-500" style={{ fontSize: "0.7rem" }}>
            {DURATIONS.find((d) => d.value === job.duration)?.label}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 font-semibold px-3.5 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
          style={{ fontSize: "0.75rem" }}
        >
          View <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// Job detail panel

function JobDetailPanel({
  job,
  onClose,
  onApply,
  hasApplied,
}: {
  job: JobDetailData;
  onClose: () => void;
  onApply: () => void;
  hasApplied: boolean;
}) {
  const durLabel = DURATIONS.find((d) => d.value === job.duration)?.label;

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-xl overflow-hidden shrink-0"
      style={{
        width: 400,
        maxHeight: "calc(100vh - 8rem)",
        position: "sticky",
        top: "1.5rem",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-black/[0.05]">
        <div className="flex flex-col gap-2 min-w-0">
          {job.recommended && (
            <div
              className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 font-bold px-2 py-0.5 rounded-full w-fit"
              style={{ fontSize: "0.58rem" }}
            >
              Recommended
            </div>
          )}
          <CategoryBadge category={job.category} />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Title */}
        <h2
          className="text-slate-900 leading-snug"
          style={{ fontSize: "1.05rem", fontWeight: 800 }}
        >
          {job.title}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {job.postedAt && (
            <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
              Posted {job.postedAt}
            </p>
          )}
          {job.status && (
            <p className="text-slate-400 capitalize" style={{ fontSize: "0.68rem" }}>
              Status: {job.status}
            </p>
          )}
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Budget",
              value: `Rs. ${job.budget}`,
              icon: Tag,
              color: "#2563EB",
              bg: "#EFF6FF",
            },
            {
              label: "Duration",
              value: durLabel ?? "",
              icon: Clock,
              color: "#14B8A6",
              bg: "#F0FDFA",
            },
            {
              label: "Deadline",
              value: job.deadline,
              icon: Calendar,
              color: "#D97706",
              bg: "#FFFBEB",
            },
            {
              label: "Complexity",
              value: job.complexity === "small" ? "Small Task" : "Medium Task",
              icon: SlidersHorizontal,
              color: "#7C3AED",
              bg: "#F5F3FF",
            },
          ].map((d) => (
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

        {/* Description */}
        <div>
          <p className="text-slate-900 font-bold mb-2" style={{ fontSize: "0.82rem" }}>
            Job Description
          </p>
          <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.8rem" }}>
            {job.description}
          </p>
        </div>

        {/* Skills */}
        <div>
          <p className="text-slate-900 font-bold mb-2.5" style={{ fontSize: "0.82rem" }}>
            Required Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((s, i) => (
              <SkillChip key={s} skill={s} index={i} />
            ))}
          </div>
        </div>

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

        {/* Attached files */}
        <div>
          <p className="text-slate-900 font-bold mb-2" style={{ fontSize: "0.82rem" }}>
            Attached Files
          </p>
          {job.attachedFiles && job.attachedFiles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {job.attachedFiles.map((file) => (
                <FileAttachmentCard key={`${file.originalName}-${file.url}`} attachment={file} />
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
        {job.client && <ClientInformationCard client={job.client} />}
      </div>

      {/* Sticky footer */}
      <div className="p-4 border-t border-black/[0.05] flex gap-3">
        <motion.button
          whileHover={!hasApplied ? { scale: 1.02 } : {}}
          whileTap={!hasApplied ? { scale: 0.97 } : {}}
          onClick={onApply}
          disabled={hasApplied}
          className={`flex-1 inline-flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors shadow-md ${
            hasApplied
              ? "bg-emerald-50 text-emerald-600 cursor-default"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 hover:shadow-lg"
          }`}
          style={{ fontSize: "0.875rem" }}
        >
          {hasApplied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Application Submitted
            </>
          ) : (
            <>
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
        <button
          onClick={onClose}
          className="px-3 py-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
          style={{ fontSize: "0.75rem" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Mobile detail modal

function MobileDetailModal({
  job,
  onClose,
  onApply,
  hasApplied,
}: {
  job: JobDetailData;
  onClose: () => void;
  onApply: () => void;
  hasApplied: boolean;
}) {
  const durLabel = DURATIONS.find((d) => d.value === job.duration)?.label;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-black/[0.05]">
            <CategoryBadge category={job.category} />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              {job.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {job.postedAt && (
                <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                  Posted {job.postedAt}
                </p>
              )}
              {job.status && (
                <p className="text-slate-400 capitalize" style={{ fontSize: "0.68rem" }}>
                  Status: {job.status}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-slate-400" style={{ fontSize: "0.6rem", fontWeight: 600 }}>
                  Budget
                </p>
                <p className="text-blue-600 font-bold" style={{ fontSize: "0.82rem" }}>
                  Rs. {job.budget}
                </p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3">
                <p className="text-slate-400" style={{ fontSize: "0.6rem", fontWeight: 600 }}>
                  Duration
                </p>
                <p className="text-teal-500 font-bold" style={{ fontSize: "0.82rem" }}>
                  {durLabel}
                </p>
              </div>
              {job.deadline && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-slate-400" style={{ fontSize: "0.6rem", fontWeight: 600 }}>
                    Deadline
                  </p>
                  <p className="text-amber-600 font-bold" style={{ fontSize: "0.82rem" }}>
                    {job.deadline}
                  </p>
                </div>
              )}
            </div>
            <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.8rem" }}>
              {job.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s, i) => (
                <SkillChip key={s} skill={s} index={i} />
              ))}
            </div>
            {job.requirements && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-slate-900 font-semibold mb-1" style={{ fontSize: "0.72rem" }}>
                  Client Requirements
                </p>
                <p className="text-slate-500" style={{ fontSize: "0.78rem" }}>
                  {job.requirements}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-900 font-bold mb-2" style={{ fontSize: "0.82rem" }}>
                Attached Files
              </p>
              {job.attachedFiles && job.attachedFiles.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {job.attachedFiles.map((file) => (
                    <FileAttachmentCard
                      key={`${file.originalName}-${file.url}`}
                      attachment={file}
                    />
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
            {job.client && <ClientInformationCard client={job.client} />}
          </div>
          <div className="p-4 border-t border-black/[0.05]">
            <button
              onClick={onApply}
              disabled={hasApplied}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl ${
                hasApplied
                  ? "bg-emerald-50 text-emerald-600 cursor-default"
                  : "bg-blue-600 text-white"
              }`}
              style={{ fontSize: "0.875rem" }}
            >
              {hasApplied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Application Submitted
                </>
              ) : (
                <>
                  Apply for this Job <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function JobDetailStatusPanel({
  loading,
  message,
  onClose,
}: {
  loading: boolean;
  message: string;
  onClose: () => void;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      {loading ? (
        <motion.span
          className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
          <Search className="w-9 h-9 text-slate-300" />
        </div>
      )}
      <div>
        <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          {message}
        </p>
        {!loading && (
          <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
            Please try again later.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 32 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-xl overflow-hidden shrink-0"
        style={{
          width: 400,
          maxHeight: "calc(100vh - 8rem)",
          position: "sticky",
          top: "1.5rem",
        }}
      >
        <div className="flex items-center justify-between gap-3 p-5 border-b border-black/[0.05]">
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
            Job Details
          </p>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{content}</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-black/[0.05]">
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              Job Details
            </p>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{content}</div>
        </motion.div>
      </motion.div>
    </>
  );
}

// Empty state

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-20 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
        <Search className="w-9 h-9 text-slate-300" />
      </div>
      <div>
        <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          No matching jobs found
        </p>
        <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
          Try adjusting your filters or search keyword.
        </p>
      </div>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors"
        style={{ fontSize: "0.85rem" }}
      >
        Clear all filters
      </button>
    </motion.div>
  );
}

// Filter chip

function FilterChip({
  label,
  active,
  onClick,
  color = "#2563EB",
  bg = "#EFF6FF",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  bg?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold transition-all duration-200 whitespace-nowrap"
      style={{
        background: active ? bg : "#F8FAFC",
        color: active ? color : "#64748B",
        borderColor: active ? color : "#E2E8F0",
        boxShadow: active ? `0 0 0 2px ${color}18` : "none",
        fontSize: "0.75rem",
      }}
    >
      {active && <CheckCircle className="w-3 h-3" style={{ color }} />}
      {label}
    </motion.button>
  );
}

// Auth-required modal (reusable for both guest and student views)

export function GuestApplyModal({ onClose, jobId }: { onClose: () => void; jobId?: string }) {
  const returnParam = jobId ? `?returnTo=/browse&jobId=${jobId}` : "";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
            Student Account Required
          </p>
          <p className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
            Please sign in or create a student account to apply for jobs on SkillBridge.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            to={`/login${returnParam}`}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-center"
            style={{ fontSize: "0.875rem" }}
          >
            Login
          </Link>
          <Link
            to={`/register${returnParam}`}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold hover:bg-slate-50 transition-colors text-center"
            style={{ fontSize: "0.875rem" }}
          >
            Create Student Account
          </Link>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-500 transition-colors"
          style={{ fontSize: "0.78rem" }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// Core browse-jobs content (shared by student and guest layouts)

export function BrowseJobsCore({ isGuest = false }: { isGuest?: boolean }) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<string[]>([]);
  const [durations, setDurations] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [submittedJobIds, setSubmittedJobIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { jobId: routeJobId } = useParams<{ jobId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = routeJobId ?? searchParams.get("jobId");
  const [jobs, setJobs] = useState<BrowseJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsJob, setDetailsJob] = useState<JobDetailData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadOpenJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAllOpenJobs();

        if (mounted) {
          setJobs(response.data.map(mapJobFromApi));
        }
      } catch (error) {
        if (mounted) {
          setError(error instanceof Error ? error.message : "Failed to load jobs.");
          setJobs([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOpenJobs();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setDetailsJob(null);
      setDetailsError("");
      setDetailsLoading(false);
      return;
    }

    let mounted = true;

    const loadJobDetails = async () => {
      setDetailsLoading(true);
      setDetailsError("");
      setDetailsJob(null);

      try {
        const response = await getJobById(selectedJobId);

        if (mounted) {
          setDetailsJob(mapJobDetailsFromApi(response.data));
        }
      } catch (error) {
        if (mounted) {
          setDetailsError(error instanceof Error ? error.message : "Failed to load job details.");
        }
      } finally {
        if (mounted) {
          setDetailsLoading(false);
        }
      }
    };

    loadJobDetails();

    return () => {
      mounted = false;
    };
  }, [selectedJobId]);

  const handleViewDetails = (jobId: string) => {
    navigate(isGuest ? `/browse?jobId=${jobId}` : `/dashboard/student/browse-jobs/${jobId}`);
  };

  const handleCloseDetails = () => {
    if (routeJobId && !isGuest) {
      navigate("/dashboard/student/browse-jobs");
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("jobId");
    setSearchParams(nextParams);
  };

  const handleApply = (jobId: string) => {
    if (submittedJobIds.includes(jobId)) return;

    if (isGuest) {
      setPendingJobId(jobId);
      setShowGuestModal(true);
      return;
    }
    setApplyingJobId(jobId);
  };

  const handleApplicationSubmitted = (jobId: string, message: string) => {
    setSubmittedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
    setNotification({
      type: "success",
      text: message,
    });
  };

  const handleApplicationError = (message: string) => {
    setNotification({
      type: "error",
      text: message,
    });
  };

  const toggleArr = (arr: string[], setArr: (a: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const openJobs = useMemo(() => jobs.filter((job) => (job.status ?? "open") === "open"), [jobs]);

  const filtered = useMemo(() => {
    return openJobs.filter((job) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.skills.some((s) => s.toLowerCase().includes(q)) ||
        job.description.toLowerCase().includes(q);
      const matchesCat = !categories.length || categories.includes(job.category);
      const matchesComp = !complexity.length || complexity.includes(job.complexity);
      const matchesDur = !durations.length || durations.includes(job.duration);
      return matchesQuery && matchesCat && matchesComp && matchesDur;
    });
  }, [query, categories, complexity, durations, openJobs]);

  const hasFilters = query || categories.length || complexity.length || durations.length;

  const clearAll = () => {
    setQuery("");
    setCategories([]);
    setComplexity([]);
    setDurations([]);
  };

  return (
    <>
      <div className="flex gap-6 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {!isGuest && <VerificationReminderCard />}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs by title, skill, or keyword..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-12 py-4 text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:shadow-lg shadow-sm"
              style={{ fontSize: "0.9rem" }}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Filters */}
          <div className="bg-white border border-black/[0.05] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            {/* Categories */}
            <div className="flex items-start gap-3">
              <span
                className="text-slate-400 font-semibold pt-1 shrink-0"
                style={{ fontSize: "0.7rem", width: 72 }}
              >
                Category
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                  <FilterChip
                    key={val}
                    label={cfg.label}
                    active={categories.includes(val)}
                    onClick={() => toggleArr(categories, setCategories, val)}
                    color={cfg.color}
                    bg={cfg.bg}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-black/[0.04]" />

            {/* Complexity + Duration */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <span
                  className="text-slate-400 font-semibold shrink-0"
                  style={{ fontSize: "0.7rem", width: 72 }}
                >
                  Complexity
                </span>
                <div className="flex gap-2">
                  {[
                    { v: "small", l: "Small Task" },
                    { v: "medium", l: "Medium Task" },
                  ].map((o) => (
                    <FilterChip
                      key={o.v}
                      label={o.l}
                      active={complexity.includes(o.v)}
                      onClick={() => toggleArr(complexity, setComplexity, o.v)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="text-slate-400 font-semibold pt-1 shrink-0"
                  style={{ fontSize: "0.7rem", width: 60 }}
                >
                  Duration
                </span>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <FilterChip
                      key={d.value}
                      label={d.label}
                      active={durations.includes(d.value)}
                      onClick={() => toggleArr(durations, setDurations, d.value)}
                      color="#14B8A6"
                      bg="#F0FDFA"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="self-end text-red-400 hover:text-red-500 font-semibold transition-colors"
                style={{ fontSize: "0.75rem" }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-slate-500" style={{ fontSize: "0.82rem" }}>
              <span className="text-slate-900 font-bold">{filtered.length}</span> job
              {filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-2 rounded-lg transition-all duration-200 ${view === v ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-500"}`}
                >
                  {v === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Job grid / list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <motion.span
                className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-slate-500" style={{ fontSize: "0.85rem" }}>
                Loading jobs...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                <Search className="w-9 h-9 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                  {error}
                </p>
                <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
                  Please try again later.
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={
                  view === "grid"
                    ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "flex flex-col gap-3"
                }
              >
                <AnimatePresence>
                  {filtered.map((job) =>
                    view === "grid" ? (
                      <JobCard
                        key={job.id}
                        job={job}
                        onView={() => handleViewDetails(job.id)}
                        selected={selectedJobId === job.id}
                      />
                    ) : (
                      <JobCardList
                        key={job.id}
                        job={job}
                        onView={() => handleViewDetails(job.id)}
                        selected={selectedJobId === job.id}
                      />
                    )
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selectedJobId && detailsLoading && (
            <JobDetailStatusPanel
              key="job-details-loading"
              loading={true}
              message="Loading job details..."
              onClose={handleCloseDetails}
            />
          )}
          {selectedJobId && !detailsLoading && detailsError && (
            <JobDetailStatusPanel
              key="job-details-error"
              loading={false}
              message={detailsError}
              onClose={handleCloseDetails}
            />
          )}
          {selectedJobId && !detailsLoading && !detailsError && detailsJob && (
            <JobDetailPanel
              key={detailsJob.id}
              job={detailsJob}
              onClose={handleCloseDetails}
              onApply={() => handleApply(detailsJob.id)}
              hasApplied={submittedJobIds.includes(detailsJob.id)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {applyingJobId &&
          (() => {
            const job = openJobs.find((j) => j.id === applyingJobId) ?? detailsJob;
            return job ? (
              <ApplyModal
                key={applyingJobId}
                job={job}
                onClose={() => setApplyingJobId(null)}
                onSubmitted={handleApplicationSubmitted}
                onError={handleApplicationError}
              />
            ) : null;
          })()}
        {selectedJobId && !detailsLoading && !detailsError && detailsJob && (
          <MobileDetailModal
            key={`mobile-${detailsJob.id}`}
            job={detailsJob}
            onClose={handleCloseDetails}
            onApply={() => handleApply(detailsJob.id)}
            hasApplied={submittedJobIds.includes(detailsJob.id)}
          />
        )}
        {showGuestModal && (
          <GuestApplyModal
            jobId={pendingJobId}
            onClose={() => {
              setShowGuestModal(false);
              setPendingJobId(undefined);
            }}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </>
  );
}

// Student Browse Jobs page (with DashboardLayout)

export default function BrowseJobsPage() {
  return (
    <DashboardLayout role="student" title="Browse Jobs" activeNav="browse-jobs">
      <BrowseJobsCore isGuest={false} />
    </DashboardLayout>
  );
}
