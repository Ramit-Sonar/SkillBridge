import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import {
  Notification,
  SearchInput,
  StatusBadge,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import {
  Briefcase,
  Tag,
  Calendar,
  Users,
  Ban,
  Eye,
  ChevronDown,
  CheckCircle,
  X,
} from "lucide-react";
import { SharedJobDetailsContent } from "../../app/components/shared/SharedJobDetailsContent";
import {
  getAdminJobDetails,
  getAdminJobs,
  suspendAdminJob,
  type AdminJob as AdminJobData,
  type AdminJobStatus,
  type JobModerationReason,
} from "../../services/adminService";

type JobStatus = AdminJobStatus;

interface AdminJob {
  id: string;
  title: string;
  clientName: string;
  clientInitials: string;
  clientAvatar?: string;
  clientId?: string;
  clientLocation?: string;
  clientCompanyName?: string;
  clientWebsite?: string;
  clientAbout?: string;
  clientVerified?: boolean;
  clientJobsPosted?: number;
  clientProjectsCompleted?: number;
  clientJoinedDate?: string;
  clientRating?: number;
  category: string;
  budget: string;
  duration: string;
  deadline: string;
  complexity: "small" | "medium";
  status: JobStatus;
  moderatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  moderatedAt?: string;
  moderationReason?: string;
  customModerationReason?: string;
  postedAt: string;
  applications: number;
  description: string;
  requirements: string;
  skills: string[];
  attachedFiles: {
    url?: string;
    publicId?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  }[];
}

const STATUS_CFG: Record<JobStatus, { label: string; color: string; bg: string; border: string }> =
  {
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
    suspended: {
      label: "Suspended",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
  };

const JOB_MODERATION_REASONS: JobModerationReason[] = [
  "Spam",
  "Fake Job",
  "Duplicate Listing",
  "Policy Violation",
  "Copyright Issue",
  "Other",
];

function getInitials(name = "Unknown Client") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatAdminDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBudget(value: number | string) {
  const numericBudget = typeof value === "number" ? value : Number(value);

  if (Number.isFinite(numericBudget)) {
    return `NPR ${numericBudget.toLocaleString("en-IN")}`;
  }

  return String(value || "NPR 0");
}

function getApplicationCount(job: AdminJobData) {
  if (typeof job.applications === "number") return job.applications;
  if (Array.isArray(job.applications)) return job.applications.length;
  return job.applicationCount || job.applicationsCount || 0;
}

function mapAdminJob(job: AdminJobData): AdminJob {
  const client = job.client;
  const clientName = client?.fullName || client?.name || job.clientName || "Unknown Client";

  return {
    id: job.id || job._id || "",
    title: job.title,
    clientName,
    clientInitials: client?.initials || job.clientInitials || getInitials(clientName),
    clientAvatar: client?.avatar || job.clientAvatar || "",
    clientId: client?.id || job.clientId,
    clientLocation: client?.location || job.clientLocation || "",
    clientCompanyName: client?.companyName || job.clientCompanyName || "",
    clientWebsite: client?.website || job.clientWebsite || "",
    clientAbout: client?.bio || job.clientAbout || "",
    clientVerified: job.clientVerified ?? client?.verification?.status === "approved",
    clientJobsPosted: job.clientJobsPosted ?? client?.statistics?.jobsPosted ?? undefined,
    clientProjectsCompleted:
      job.clientProjectsCompleted ?? client?.statistics?.projectsCompleted ?? undefined,
    clientJoinedDate: formatAdminDate(job.clientJoinedDate || client?.joined || undefined),
    clientRating: job.clientRating ?? client?.statistics?.averageRating ?? undefined,
    category: job.category,
    budget: formatBudget(job.budget),
    duration: job.duration,
    deadline: formatAdminDate(job.deadline),
    complexity: job.complexity,
    status: job.status,
    moderatedBy: job.moderatedBy,
    moderatedAt: job.moderatedAt ? formatAdminDate(job.moderatedAt) : "",
    moderationReason: job.moderationReason || "",
    customModerationReason: job.customModerationReason || "",
    postedAt: formatAdminDate(job.postedAt || job.createdAt),
    applications: getApplicationCount(job),
    description: job.description,
    requirements: job.requirements,
    skills: job.skills || [],
    attachedFiles: job.attachments || [],
  };
}

function JobDetailsPanel({
  job,
  onClose,
  onSuspend,
}: {
  job: AdminJob;
  onClose: () => void;
  onSuspend: () => void;
}) {
  const canSuspend = job.status === "open";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl h-[90vh] max-h-[90vh] bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-job-details-title"
      >
        <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p
              id="admin-job-details-title"
              className="text-slate-900 font-bold"
              style={{ fontSize: "0.95rem" }}
            >
              Job Details
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              Admin view - read only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            aria-label="Close job details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <SharedJobDetailsContent
            job={{
              title: job.title,
              category: job.category,
              status: job.status,
              description: job.description,
              requirements: job.requirements,
              skills: job.skills,
              budget: job.budget,
              duration: job.duration,
              deadline: job.deadline,
              complexity: job.complexity,
              postedAt: job.postedAt,
              attachedFiles: job.attachedFiles,
              clientId: job.clientId,
              clientName: job.clientName,
              clientInitials: job.clientInitials,
              clientAvatar: job.clientAvatar,
              clientLocation: job.clientLocation,
              clientCompanyName: job.clientCompanyName,
              clientWebsite: job.clientWebsite,
              clientAbout: job.clientAbout,
              clientVerified: job.clientVerified,
              clientJobsPosted: job.clientJobsPosted,
              clientProjectsCompleted: job.clientProjectsCompleted,
              clientJoinedDate: job.clientJoinedDate,
              clientRating: job.clientRating,
            }}
            actions={
              !canSuspend ? null : (
                <button
                  onClick={onSuspend}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                  style={{ fontSize: "0.875rem" }}
                >
                  <Ban className="w-4 h-4" /> Suspend Job
                </button>
              )
            }
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SuspendJobModal({
  job,
  onConfirm,
  onClose,
  loading,
}: {
  job: AdminJob;
  onConfirm: (reason: JobModerationReason, customReason: string) => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState<JobModerationReason | "">("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");
  const requiresCustomReason = reason === "Other";

  const handleConfirm = async () => {
    if (!reason) {
      setError("Please select a moderation reason.");
      return;
    }

    if (requiresCustomReason && !customReason.trim()) {
      setError("Please enter the custom moderation reason.");
      return;
    }

    setError("");
    await onConfirm(reason, customReason.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50">
          <Ban className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
            Suspend Job
          </p>
          <p className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
            Select why you want to suspend <strong className="text-slate-900">"{job.title}"</strong>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-slate-700 font-semibold" style={{ fontSize: "0.78rem" }}>
            Moderation Reason
          </label>
          <select
            value={reason}
            onChange={(event) => {
              setReason(event.target.value as JobModerationReason);
              setError("");
            }}
            disabled={loading}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
            style={{ fontSize: "0.85rem" }}
          >
            <option value="">Select reason</option>
            {JOB_MODERATION_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {requiresCustomReason && (
            <textarea
              value={customReason}
              onChange={(event) => {
                setCustomReason(event.target.value);
                setError("");
              }}
              disabled={loading}
              rows={4}
              placeholder="Enter custom moderation reason..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-300 outline-none resize-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
              style={{ fontSize: "0.85rem" }}
            />
          )}

          {error && (
            <p className="text-red-600 font-semibold" style={{ fontSize: "0.74rem" }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:text-slate-900 transition-all disabled:opacity-60"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <motion.button
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ fontSize: "0.875rem" }}
          >
            {loading ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              "Suspend"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-semibold hover:border-slate-300 transition-colors"
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
            {["All", "Open", "Closed", "Cancelled", "Suspended"].map((opt) => (
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

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<AdminJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminJob | null>(null);
  const [suspending, setSuspending] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminJobs({ search, status: filter });
      setJobs(response.data.jobs.map(mapAdminJob));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch jobs.";
      setError(message);
      setNotification({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleViewDetails = async (jobId: string) => {
    setDetailsLoadingId(jobId);

    try {
      const response = await getAdminJobDetails(jobId);
      setSelected(mapAdminJob(response.data));
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to fetch job details.",
      });
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const updateSuspendedJob = (job: AdminJob) => {
    setJobs((prev) => prev.map((item) => (item.id === job.id ? job : item)));
    setSelected((prev) => (prev?.id === job.id ? job : prev));
  };

  const handleSuspendJob = async (reason: JobModerationReason, customReason: string) => {
    if (!suspendTarget) return;

    setSuspending(true);

    try {
      const response = await suspendAdminJob(suspendTarget.id, {
        moderationReason: reason,
        customModerationReason: customReason,
      });
      const suspendedJob = mapAdminJob(response.data);

      updateSuspendedJob(suspendedJob);
      setSuspendTarget(null);
      setNotification({ type: "success", text: response.message });
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to suspend job.",
      });
    } finally {
      setSuspending(false);
    }
  };

  return (
    <DashboardLayout role="admin" title="Jobs" activeNav="jobs">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              Jobs
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Monitor and manage all platform job listings.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-600 font-semibold" style={{ fontSize: "0.78rem" }}>
              {jobs.length} jobs
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by job title or client name..."
            className="relative flex-1 min-w-[200px]"
            inputClassName="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm"
            style={{ fontSize: "0.85rem" }}
          />
          <StatusDropdown value={filter} onChange={setFilter} />
        </div>
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <motion.span
              className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-slate-500 font-semibold" style={{ fontSize: "0.9rem" }}>
              Loading jobs...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-red-300" />
            </div>
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              Unable to Load Jobs
            </p>
            <p className="text-slate-500 max-w-md" style={{ fontSize: "0.78rem" }}>
              {error}
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              No Jobs Found
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job, i) => {
              const cfg = STATUS_CFG[job.status];
              const detailsLoading = detailsLoadingId === job.id;

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{
                    y: -2,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
                  }}
                  className="bg-white border border-black/[0.06] hover:border-blue-200 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold overflow-hidden shrink-0"
                          style={{ fontSize: "0.42rem" }}
                        >
                          {job.clientAvatar ? (
                            <img
                              src={job.clientAvatar}
                              alt={job.clientName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            job.clientInitials
                          )}
                        </div>
                        <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                          {job.clientName}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      config={cfg}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-semibold shrink-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ fontSize: "0.75rem" }}>{job.budget}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ fontSize: "0.75rem" }}>{job.applications} applications</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ fontSize: "0.75rem" }}>Posted {job.postedAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-black/[0.04]">
                    <button
                      onClick={() => handleViewDetails(job.id)}
                      disabled={detailsLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-70"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {detailsLoading ? (
                        <motion.span
                          className="w-3.5 h-3.5 rounded-full border-2 border-blue-200 border-t-blue-600"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      {detailsLoading ? "Loading" : "View Details"}
                    </button>
                    {job.status === "open" && (
                      <button
                        onClick={() => setSuspendTarget(job)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-all"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <Ban className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <JobDetailsPanel
            job={selected}
            onClose={() => setSelected(null)}
            onSuspend={() => setSuspendTarget(selected)}
          />
        )}
        {suspendTarget && (
          <SuspendJobModal
            job={suspendTarget}
            onConfirm={handleSuspendJob}
            onClose={() => {
              if (!suspending) setSuspendTarget(null);
            }}
            loading={suspending}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
