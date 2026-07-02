import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { SearchInput, SidePanel, StatusBadge } from "../../app/components/shared/ui";
import { StudentProfileView } from "../../app/components/shared/StudentProfileView";
import { StudentSummaryCard } from "../../app/components/shared/StudentSummaryCard";
import { SharedJobDetailsContent } from "../../app/components/shared/SharedJobDetailsContent";
import { JOB_CATEGORY_LABELS } from "../../constants/job.constants";
import { getClientJobs, type JobData } from "../../services/jobService";
import { type FileAttachment } from "../../utils/fileUtils";
import {
  PlusCircle,
  MoreVertical,
  Users,
  Calendar,
  Tag,
  Briefcase,
  X,
  ChevronDown,
  CheckCircle,
  Eye,
  UserCheck,
  XCircle,
  Edit3,
} from "lucide-react";

// Types

type JobStatus = "open" | "closed" | "cancelled";
type AppStatus = "pending" | "hired" | "rejected";

interface VerifiedSkill {
  name: string;
  verified: boolean;
}

interface Applicant {
  id: string;
  name: string;
  initials: string;
  education: string;
  university: string;
  verified: boolean;
  skills: VerifiedSkill[];
  rating: number;
  reviewCount: number;
  completedProjects: number;
  bio: string;
  appliedAt: string;
  status: AppStatus;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

interface Job {
  id: string;
  title: string;
  category: string;
  categoryKey: string;
  status: JobStatus;
  budget: string;
  budgetRaw: string;
  postedAt: string;
  description: string;
  requirements: string;
  complexity: string;
  duration: string;
  deadline: string;
  skills: string[];
  attachedFiles?: FileAttachment[];
  applicants: Applicant[];
}

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

function mapJobFromApi(job: JobData): Job {
  const categoryKey = job.category;
  const attachments = job.attachments as (FileAttachment | string)[] | undefined;
  const budgetRaw = String(job.budget ?? "");
  const numericBudget = Number(job.budget);
  const budget = Number.isNaN(numericBudget)
    ? `NPR ${budgetRaw}`
    : `NPR ${numericBudget.toLocaleString("en-IN")}`;
  const status = job.status === "closed" || job.status === "cancelled" ? job.status : "open";

  return {
    id: job._id ?? "",
    title: job.title,
    category: JOB_CATEGORY_LABELS[categoryKey as keyof typeof JOB_CATEGORY_LABELS] ?? categoryKey,
    categoryKey,
    status,
    budget,
    budgetRaw,
    postedAt: formatJobDate(job.createdAt),
    description: job.description ?? "",
    requirements: job.requirements ?? "",
    complexity: job.complexity ?? "",
    duration: job.duration,
    deadline: formatDeadline(job.deadline),
    skills: job.skills ?? [],
    attachedFiles: attachments
      ?.map((attachment) => {
        if (typeof attachment === "string") {
          return {
            url: attachment,
            publicId: "",
            originalName: attachment,
            mimeType: "application/octet-stream",
            size: 0,
          };
        }

        return attachment;
      })
      .filter((attachment) => Boolean(attachment.originalName)),
    applicants: [],
  };
}
// Helpers

const JOB_STATUS_CFG: Record<
  JobStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  open: { label: "Open", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
  closed: {
    label: "Closed",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
  cancelled: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

const APP_STATUS_CFG: Record<
  AppStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  hired: { label: "Hired", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
  rejected: {
    label: "Rejected",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
};

// Three-dot menu

function CardMenu({ onEdit, onCancel }: { onEdit: () => void; onCancel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-44 bg-white border border-black/[0.07] rounded-xl shadow-lg z-30 overflow-hidden py-1"
          >
            {[
              {
                icon: Edit3,
                label: "Edit Job",
                onClick: onEdit,
                danger: false,
              },
              {
                icon: XCircle,
                label: "Cancel Job",
                onClick: onCancel,
                danger: true,
              },
            ].map(({ icon: Icon, label, onClick, danger }) => (
              <button
                key={label}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors ${danger ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                style={{ fontSize: "0.8rem" }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Confirm modal

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
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
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
      >
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
            {title}
          </p>
          <p
            className="text-slate-500 mt-1.5 leading-relaxed"
            style={{ fontSize: "0.82rem" }}
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setBusy(true);
              setTimeout(onConfirm, 700);
            }}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: confirmColor, fontSize: "0.875rem" }}
          >
            {busy ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              confirmLabel
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Cancel job modal

function DeleteModal({
  jobTitle,
  onConfirm,
  onClose,
}: {
  jobTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmModal
      title="Cancel Job"
      message={`Are you sure you want to cancel <strong>"${jobTitle}"</strong>? The job will stay in your records.`}
      confirmLabel="Cancel Job"
      confirmColor="#DC2626"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

// Student Profile panel — uses shared StudentProfileView

function StudentProfilePanel({
  applicant,
  jobTitle,
  onClose,
  onHire,
  onReject,
}: {
  applicant: Applicant;
  jobTitle: string;
  onClose: () => void;
  onHire: () => void;
  onReject: () => void;
}) {
  const [hireModal, setHireModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const appCfg = APP_STATUS_CFG[applicant.status];

  const profileData = {
    name: applicant.name,
    initials: applicant.initials,
    headline: applicant.university,
    education: applicant.education,
    university: applicant.university,
    bio: applicant.bio,
    verified: applicant.verified,
    skills: applicant.skills,
    rating: applicant.rating,
    reviewCount: applicant.reviewCount,
    completedProjectsCount: applicant.completedProjects,
    github: applicant.github,
    linkedin: applicant.linkedin,
    portfolio: applicant.portfolio,
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-end"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl bg-slate-50 flex flex-col h-full shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <p className="text-slate-900 font-bold" style={{ fontSize: "0.9rem" }}>
                  Student Profile
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge
                    config={appCfg}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold"
                    dotClassName="w-1 h-1 rounded-full"
                    style={{ fontSize: "0.58rem" }}
                  />
                  <span className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                    · Applied {applicant.appliedAt} for{" "}
                    <span className="text-slate-500 font-medium">{jobTitle}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full profile — shared component */}
          <div className="flex-1 overflow-y-auto p-5">
            <StudentProfileView profile={profileData} />
          </div>

          {/* Sticky action bar */}
          {applicant.status === "pending" && (
            <div className="bg-white border-t border-black/[0.05] px-5 py-4 flex gap-3 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setHireModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                style={{ fontSize: "0.85rem" }}
              >
                <UserCheck className="w-4 h-4" /> Hire
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setRejectModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                style={{ fontSize: "0.85rem" }}
              >
                <XCircle className="w-4 h-4" /> Reject
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hireModal && (
          <ConfirmModal
            title="Hire Student"
            message={`Are you sure you want to hire <strong>${applicant.name}</strong> for:<br/><strong>${jobTitle}</strong>`}
            confirmLabel="Hire Student"
            confirmColor="#059669"
            onConfirm={() => {
              setHireModal(false);
              onHire();
            }}
            onClose={() => setHireModal(false)}
          />
        )}
        {rejectModal && (
          <ConfirmModal
            title="Reject Application"
            message="Are you sure you want to reject this application?"
            confirmLabel="Reject"
            confirmColor="#64748B"
            onConfirm={() => {
              setRejectModal(false);
              onReject();
            }}
            onClose={() => setRejectModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Applications panel (list view)

function ApplicationsPanel({
  job,
  onClose,
  onUpdateStatus,
}: {
  job: Job;
  onClose: () => void;
  onUpdateStatus: (jobId: string, appId: string, status: AppStatus) => void;
}) {
  const [profileApplicant, setProfileApplicant] = useState<Applicant | null>(null);
  const [hireTarget, setHireTarget] = useState<Applicant | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Applicant | null>(null);

  const handleHire = (a: Applicant) => {
    onUpdateStatus(job.id, a.id, "hired");
    setProfileApplicant((prev) => (prev?.id === a.id ? { ...prev, status: "hired" } : prev));
  };
  const handleReject = (a: Applicant) => {
    onUpdateStatus(job.id, a.id, "rejected");
    setProfileApplicant((prev) => (prev?.id === a.id ? { ...prev, status: "rejected" } : prev));
  };

  // Sorted: pending first
  const sorted = [...job.applicants].sort((a, b) => {
    const order: Record<AppStatus, number> = {
      pending: 0,
      hired: 1,
      rejected: 2,
    };
    return order[a.status] - order[b.status];
  });

  if (profileApplicant) {
    return (
      <StudentProfilePanel
        applicant={job.applicants.find((a) => a.id === profileApplicant.id) ?? profileApplicant}
        jobTitle={job.title}
        onClose={() => setProfileApplicant(null)}
        onHire={() => handleHire(profileApplicant)}
        onReject={() => handleReject(profileApplicant)}
      />
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-end"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg bg-slate-50 flex flex-col h-full shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                {job.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
                  {job.applicants.length} Applicant
                  {job.applicants.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-400" style={{ fontSize: "0.82rem" }}>
                  No applications yet.
                </p>
              </div>
            ) : (
              sorted.map((a, i) => {
                const appCfg = APP_STATUS_CFG[a.status];
                return (
                  <StudentSummaryCard
                    key={a.id}
                    initials={a.initials}
                    name={a.name}
                    education={a.education}
                    headline={a.university}
                    verified={a.verified}
                    rating={a.rating}
                    reviewCount={a.reviewCount}
                    completedProjects={a.completedProjects}
                    skills={a.skills}
                    delay={i * 0.06}
                    meta={`Applied ${a.appliedAt}`}
                    badge={<StatusBadge config={appCfg} style={{ fontSize: "0.6rem" }} />}
                    actions={
                      <>
                        <button
                          onClick={() => setProfileApplicant(a)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-semibold transition-all"
                          style={{ fontSize: "0.68rem" }}
                        >
                          <Eye className="w-3 h-3" /> Profile
                        </button>
                        {a.status === "pending" && (
                          <>
                            <button
                              onClick={() => setHireTarget(a)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transition-all"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <UserCheck className="w-3 h-3" /> Hire
                            </button>
                            <button
                              onClick={() => setRejectTarget(a)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-semibold transition-all"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                      </>
                    }
                  />
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hireTarget && (
          <ConfirmModal
            title="Hire Student"
            message={`Are you sure you want to hire <strong>${hireTarget.name}</strong> for:<br/><strong>${job.title}</strong>`}
            confirmLabel="Hire Student"
            confirmColor="#059669"
            onConfirm={() => {
              handleHire(hireTarget);
              setHireTarget(null);
            }}
            onClose={() => setHireTarget(null)}
          />
        )}
        {rejectTarget && (
          <ConfirmModal
            title="Reject Application"
            message="Are you sure you want to reject this application?"
            confirmLabel="Reject"
            confirmColor="#64748B"
            onConfirm={() => {
              handleReject(rejectTarget);
              setRejectTarget(null);
            }}
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Job Details panel (read-only)

function JobDetailsPanel({
  job,
  onClose,
  onViewApplications,
}: {
  job: Job;
  onClose: () => void;
  onViewApplications: () => void;
}) {
  return (
    <SidePanel
      title="Job Details"
      subtitle="Read-only view"
      onClose={onClose}
      bodyClassName="flex-1 min-h-0"
    >
      <SharedJobDetailsContent
        showClientCard={false}
        job={{
          title: job.title,
          category: job.categoryKey,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          budget: job.budget,
          duration: job.duration,
          deadline: job.deadline,
          complexity: job.complexity,
          postedAt: job.postedAt,
          attachedFiles: job.attachedFiles,
        }}
        actions={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onClose();
              onViewApplications();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            style={{ fontSize: "0.82rem" }}
          >
            <Users className="w-3.5 h-3.5" /> Applications ({job.applicants.length})
          </motion.button>
        }
      />
    </SidePanel>
  );
}

// Status dropdown

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-semibold hover:border-slate-300 transition-colors"
        style={{ fontSize: "0.82rem" }}
      >
        {value} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-1 w-36 bg-white border border-black/[0.07] rounded-xl shadow-lg z-20 overflow-hidden py-1"
          >
            {["All", "Open", "Closed", "Cancelled"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors ${value === opt ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                style={{ fontSize: "0.8rem" }}
              >
                {opt} {value === opt && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Job card

function JobCard({
  job,
  onCancel,
  onViewDetails,
  onViewApplications,
  navigate,
}: {
  job: Job;
  onCancel: () => void;
  onViewDetails: () => void;
  onViewApplications: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const cfg = JOB_STATUS_CFG[job.status];
  const editState = {
    editJob: {
      id: job.id,
      title: job.title,
      category: job.categoryKey,
      description: job.description,
      requirements: job.requirements,
      complexity: job.complexity,
      duration: job.duration,
      budget: job.budgetRaw,
      deadline: job.deadline,
      skills: job.skills,
    },
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
      className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-bold leading-tight" style={{ fontSize: "0.95rem" }}>
            {job.title}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>
            {job.category}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge config={cfg} />
          <CardMenu
            onEdit={() => navigate("/dashboard/client/post-job", { state: editState })}
            onCancel={onCancel}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span style={{ fontSize: "0.75rem" }}>
            {job.applicants.length} Application
            {job.applicants.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span style={{ fontSize: "0.75rem" }}>{job.budget}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span style={{ fontSize: "0.75rem" }}>Posted {job.postedAt}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-black/[0.04]">
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
          style={{ fontSize: "0.75rem" }}
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onViewApplications}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          style={{ fontSize: "0.75rem" }}
        >
          <Users className="w-3.5 h-3.5" /> Applications ({job.applicants.length})
        </motion.button>
      </div>
    </motion.div>
  );
}

// Page

export default function ManageJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cancelTarget, setCancelTarget] = useState<Job | null>(null);
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [applicationsJob, setApplicationsJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClientJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getClientJobs();
      setJobs(response.data.map(mapJobFromApi));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientJobs();
  }, [loadClientJobs]);

  const updateAppStatus = (jobId: string, appId: string, status: AppStatus) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id !== jobId
          ? j
          : {
              ...j,
              applicants: j.applicants.map((a) => (a.id === appId ? { ...a, status } : a)),
            }
      )
    );
    if (applicationsJob?.id === jobId) {
      setApplicationsJob((prev) =>
        prev
          ? {
              ...prev,
              applicants: prev.applicants.map((a) => (a.id === appId ? { ...a, status } : a)),
            }
          : null
      );
    }
  };

  const refreshJobs = () => {
    loadClientJobs();
  };

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || j.title.toLowerCase().includes(q) || j.category.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || j.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="client" title="Manage Jobs" activeNav="manage-jobs">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              Manage Jobs
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Manage and monitor all your posted jobs.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard/client/post-job")}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            style={{ fontSize: "0.82rem" }}
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </motion.button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search jobs by title or category..."
            className="relative flex-1 min-w-[200px]"
            inputClassName="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            iconClassName="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            style={{ fontSize: "0.85rem" }}
          />
          <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <motion.span
              className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-slate-400" style={{ fontSize: "0.82rem" }}>
              Loading jobs...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                {error}
              </p>
              <p className="text-slate-400 mt-1" style={{ fontSize: "0.82rem" }}>
                Please try again later.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                {jobs.length === 0
                  ? "You haven't posted any jobs yet."
                  : "No jobs match your search."}
              </p>
              <p className="text-slate-400 mt-1" style={{ fontSize: "0.82rem" }}>
                {jobs.length === 0
                  ? "Post your first job to start receiving applications."
                  : "Try a different search term or filter."}
              </p>
            </div>
            {jobs.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard/client/post-job")}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                style={{ fontSize: "0.85rem" }}
              >
                <PlusCircle className="w-4 h-4" /> Post Your First Job
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filtered.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <JobCard
                    job={job}
                    navigate={navigate}
                    onCancel={() => setCancelTarget(job)}
                    onViewDetails={() => setDetailsJob(job)}
                    onViewApplications={() => setApplicationsJob(job)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {cancelTarget && (
          <DeleteModal
            jobTitle={cancelTarget.title}
            onConfirm={() => {
              refreshJobs();
              setCancelTarget(null);
            }}
            onClose={() => setCancelTarget(null)}
          />
        )}
        {detailsJob && (
          <JobDetailsPanel
            job={detailsJob}
            onClose={() => setDetailsJob(null)}
            onViewApplications={() => setApplicationsJob(detailsJob)}
          />
        )}
        {applicationsJob && (
          <ApplicationsPanel
            job={applicationsJob}
            onClose={() => setApplicationsJob(null)}
            onUpdateStatus={updateAppStatus}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
