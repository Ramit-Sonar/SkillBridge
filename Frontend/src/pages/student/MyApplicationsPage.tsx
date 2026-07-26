import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Ban,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  Search,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import {
  ConfirmDialog,
  FilterChipGroup,
  Notification,
  StatusBadge,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import {
  SharedJobDetailsContent,
  type JobDetailData,
} from "../../app/components/shared/SharedJobDetailsContent";
import {
  APPLICATION_STATUS_CFG as APP_STATUS_CFG,
  ReadOnlyApplicationView,
  type ApplicationDetailsData,
} from "../../app/components/shared/ApplicationDetailsContent";
import {
  getApplicationById,
  getMyApplications,
  withdrawApplication,
  type ApplicationCard as ApiApplicationCard,
  type ApplicationDetails as ApiApplicationDetails,
} from "../../services/applicationService";
import { JOB_CATEGORY_LABELS } from "../../constants/job.constants";

type AppStatus = ApplicationDetailsData["status"];

interface ApplicationListItem {
  id: string;
  jobTitle: string;
  category: string;
  budget: string;
  status: AppStatus;
  appliedAt: string;
  coverSnippet: string;
  estimatedTime: string;
}

interface Application extends ApplicationDetailsData {
  id: string;
  jobTitle: string;
  category: string;
  budget: string;
  coverSnippet: string;
  job: JobDetailData;
}

const APP_FILTERS: { label: string; value: AppStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Withdrawn", value: "withdrawn" },
];

function formatDate(date?: string | null) {
  if (!date) return undefined;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatRelativeTime(date?: string | null) {
  if (!date) return "Date not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date not available";
  }

  const diffMs = Date.now() - parsedDate.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const units = [
    { label: "year", seconds: 60 * 60 * 24 * 365 },
    { label: "month", seconds: 60 * 60 * 24 * 30 },
    { label: "week", seconds: 60 * 60 * 24 * 7 },
    { label: "day", seconds: 60 * 60 * 24 },
    { label: "hour", seconds: 60 * 60 },
    { label: "minute", seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(diffSeconds / unit.seconds);

    if (value >= 1) {
      return `${value} ${unit.label}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

function getCategoryLabel(category?: string) {
  if (!category) return "Uncategorized";

  return JOB_CATEGORY_LABELS[category as keyof typeof JOB_CATEGORY_LABELS] ?? category;
}

function getInitials(name?: string) {
  if (!name) return "";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function mapApplicationCard(application: ApiApplicationCard): ApplicationListItem {
  const job = application.job;

  return {
    id: application.applicationId,
    jobTitle: job?.title ?? "Job unavailable",
    category: getCategoryLabel(job?.jobType),
    budget: String(job?.budget ?? "Not specified"),
    status: application.status,
    appliedAt: formatDate(application.appliedAt) ?? application.appliedAt,
    coverSnippet: job?.clientName
      ? `Submitted to ${job.clientName}`
      : "Open details to view your submitted application.",
    estimatedTime: formatRelativeTime(application.appliedAt),
  };
}

function mapApplicationDetails(application: ApiApplicationDetails): Application {
  const job = application.job;
  const client = job?.client;
  const jobTitle = job?.title ?? "Job unavailable";

  // Detail view merges the submitted proposal with its related job/client summary.
  return {
    id: application.applicationId,
    jobTitle,
    category: getCategoryLabel(job?.category),
    budget: String(job?.budget ?? "Not specified"),
    coverSnippet: application.coverMessage,
    status: application.status,
    appliedAt: formatDate(application.appliedAt) ?? application.appliedAt,
    updatedAt: formatDate(application.updatedAt),
    acceptedAt: formatDate(application.acceptedAt),
    rejectedAt: formatDate(application.rejectedAt),
    withdrawnAt: formatDate(application.withdrawnAt),
    estimatedTime: application.estimatedCompletionTime,
    coverMessage: application.coverMessage,
    whySuitable: application.whySuitable,
    attachments: application.attachments,
    job: {
      title: jobTitle,
      category: job?.category ?? "other",
      status: job?.status,
      description: job?.description ?? "",
      requirements: job?.requirements ?? "",
      skills: job?.skills ?? [],
      budget: String(job?.budget ?? "Not specified"),
      duration: job?.duration,
      deadline: formatDate(job?.deadline),
      complexity: job?.complexity,
      postedAt: formatDate(job?.createdAt),
      attachedFiles: job?.attachments ?? [],
      clientName: client?.fullName,
      clientInitials: getInitials(client?.fullName),
      clientAvatar: client?.avatar,
      clientLocation: client?.location,
      clientCompanyName: client?.companyName,
      clientWebsite: client?.website,
      clientAbout: client?.bio,
      clientVerified: client?.verification.status === "approved",
      clientJobsPosted: client?.statistics.jobsPosted,
      clientProjectsCompleted: client?.statistics.projectsCompleted ?? undefined,
      clientJoinedDate: formatDate(client?.joined),
      clientRating: client?.statistics.averageRating ?? undefined,
    },
  };
}

function ApplicationsLoading() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4"
        >
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-5 w-2/3 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-5 w-20 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-5 w-24 rounded bg-slate-100 animate-pulse" />
              <div className="h-5 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ApplicationsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Could not load applications
        </p>
        <p className="text-red-500 mt-1" style={{ fontSize: "0.82rem" }}>
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="bg-white text-red-500 border border-red-200 font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
        style={{ fontSize: "0.82rem" }}
      >
        Try Again
      </button>
    </div>
  );
}

type DetailTab = "job" | "application";

function ApplicationAction({ app, onWithdraw }: { app: Application; onWithdraw: () => void }) {
  const navigate = useNavigate();

  if (app.status === "pending") {
    return (
      <button
        type="button"
        onClick={onWithdraw}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-colors"
        style={{ fontSize: "0.85rem" }}
      >
        <X className="w-4 h-4" /> Withdraw Application
      </button>
    );
  }

  if (app.status === "accepted") {
    return (
      <button
        type="button"
        onClick={() => navigate("/dashboard/student/projects")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        style={{ fontSize: "0.85rem" }}
      >
        <FolderOpen className="w-4 h-4" /> Go To Project
      </button>
    );
  }

  const isRejected = app.status === "rejected";

  return (
    <div
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold ${
        isRejected
          ? "border-red-100 bg-red-50 text-red-500"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
      style={{ fontSize: "0.85rem" }}
      aria-disabled="true"
    >
      {isRejected ? <Ban className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
      {isRejected ? "Application Rejected" : "Application Withdrawn"}
    </div>
  );
}

function ViewDetailsPanel({
  app,
  onClose,
  onWithdraw,
}: {
  app: Application;
  onClose: () => void;
  onWithdraw: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<DetailTab>("job");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const tabs: { label: string; value: DetailTab }[] = [
    { label: "Job Details", value: "job" },
    { label: "My Application", value: "application" },
  ];

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
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
          aria-labelledby="application-workspace-title"
        >
          <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
            <div>
              <p
                id="application-workspace-title"
                className="text-slate-900 font-bold"
                style={{ fontSize: "0.95rem" }}
              >
                Application Details
              </p>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
                Applied {app.appliedAt}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              aria-label="Close application workspace"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white border-b border-black/[0.05] px-5 py-3 flex gap-2 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className="px-4 py-1.5 rounded-full border font-semibold transition-all duration-200"
                aria-pressed={tab === t.value}
                style={{
                  background: tab === t.value ? "#EFF6FF" : "#F8FAFC",
                  color: tab === t.value ? "#2563EB" : "#64748B",
                  borderColor: tab === t.value ? "#BFDBFE" : "#E2E8F0",
                  fontSize: "0.78rem",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {tab === "job" ? (
                <motion.div
                  key="job"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SharedJobDetailsContent job={app.job} showClientReportAction={true} />
                </motion.div>
              ) : (
                <motion.div
                  key="application"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ReadOnlyApplicationView
                    application={app}
                    action={
                      <ApplicationAction app={app} onWithdraw={() => setShowWithdraw(true)} />
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showWithdraw && (
          <ConfirmDialog
            icon={AlertTriangle}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            align="center"
            busyDelayMs={0}
            title="Withdraw Application?"
            body={
              <>
                Are you sure you want to withdraw your application for{" "}
                <span className="font-semibold text-slate-900">"{app.jobTitle}"</span>? This action
                cannot be undone.
              </>
            }
            confirmLabel="Withdraw Application"
            confirmColor="#EF4444"
            onConfirm={async () => {
              await onWithdraw(app.id);
              setShowWithdraw(false);
            }}
            onClose={() => setShowWithdraw(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AppCard({
  app,
  onWithdraw,
  onViewDetails,
  loadingDetails,
}: {
  app: ApplicationListItem;
  onWithdraw: (id: string) => Promise<void>;
  onViewDetails: (id: string) => void;
  loadingDetails: boolean;
}) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const navigate = useNavigate();
  const cfg = APP_STATUS_CFG[app.status];

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="group bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col sm:flex-row sm:items-start gap-4"
      >
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-start gap-3 flex-wrap">
            <StatusBadge
              config={cfg}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold"
              style={{ fontSize: "0.65rem" }}
            />
            <span className="text-slate-400" style={{ fontSize: "0.65rem" }}>
              Applied {app.appliedAt}
            </span>
          </div>
          <h3
            className="text-slate-900 leading-snug"
            style={{ fontSize: "0.95rem", fontWeight: 700 }}
          >
            {app.jobTitle}
          </h3>
          <p
            className="text-slate-500 leading-relaxed line-clamp-1"
            style={{ fontSize: "0.78rem" }}
          >
            {app.coverSnippet}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full"
              style={{ fontSize: "0.62rem" }}
            >
              {app.category}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                {app.estimatedTime}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                Rs. {app.budget}
              </span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <button
            onClick={() => onViewDetails(app.id)}
            disabled={loadingDetails}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-200 transition-all duration-200 disabled:opacity-60"
            style={{ fontSize: "0.75rem" }}
          >
            {loadingDetails ? "Loading..." : "View Details"} <ChevronRight className="w-3 h-3" />
          </button>

          {app.status === "pending" && (
            <button
              onClick={() => setShowWithdraw(true)}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 font-semibold px-4 py-2 rounded-xl border border-transparent hover:border-red-100 transition-all duration-200"
              style={{ fontSize: "0.75rem" }}
            >
              <X className="w-3 h-3" /> Withdraw
            </button>
          )}

          {app.status === "accepted" && (
            <button
              onClick={() => navigate("/dashboard/student/projects")}
              className="inline-flex items-center gap-1.5 text-emerald-600 hover:bg-emerald-50 font-semibold px-4 py-2 rounded-xl border border-transparent hover:border-emerald-300 transition-all duration-200"
              style={{ fontSize: "0.75rem" }}
            >
              <FolderOpen className="w-3 h-3" /> Go To Project
            </button>
          )}

          {app.status === "rejected" && (
            <span
              className="inline-flex items-center gap-1.5 text-red-500 bg-red-50 font-semibold px-4 py-2 rounded-xl border border-red-100"
              style={{ fontSize: "0.75rem" }}
              aria-disabled="true"
            >
              <Ban className="w-3 h-3" /> Application Rejected
            </span>
          )}

          {app.status === "withdrawn" && (
            <span
              className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 font-semibold px-4 py-2 rounded-xl border border-slate-200"
              style={{ fontSize: "0.75rem" }}
              aria-disabled="true"
            >
              <ShieldCheck className="w-3 h-3" /> Application Withdrawn
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showWithdraw && (
          <ConfirmDialog
            icon={AlertTriangle}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            align="center"
            busyDelayMs={0}
            title="Withdraw Application?"
            body={
              <>
                Are you sure you want to withdraw your application for{" "}
                <span className="font-semibold text-slate-900">"{app.jobTitle}"</span>? This action
                cannot be undone.
              </>
            }
            confirmLabel="Withdraw Application"
            confirmColor="#EF4444"
            onConfirm={async () => {
              await onWithdraw(app.id);
              setShowWithdraw(false);
            }}
            onClose={() => setShowWithdraw(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AppliedEmpty() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-20 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
        <FileText className="w-9 h-9 text-slate-300" />
      </div>
      <div>
        <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          No Applications Yet
        </p>
        <p className="text-slate-500 mt-1 max-w-xs leading-relaxed" style={{ fontSize: "0.85rem" }}>
          You haven't applied for any jobs yet. Browse available opportunities to get started.
        </p>
      </div>
      <button
        onClick={() => navigate("/dashboard/student/browse-jobs")}
        className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        style={{ fontSize: "0.875rem" }}
      >
        <Search className="w-4 h-4" /> Browse Jobs
      </button>
    </motion.div>
  );
}

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [appFilter, setAppFilter] = useState<AppStatus | "all">("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const loadApplications = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await getMyApplications();
      setApps(response.data.applications.map(mapApplicationCard));
    } catch (error) {
      const message = getMessage(error, "Failed to load applications.");
      setLoadError(message);
      setNotification({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApps = appFilter === "all" ? apps : apps.filter((app) => app.status === appFilter);

  const appCounts: Record<string, number> = { all: apps.length };
  apps.forEach((app) => {
    appCounts[app.status] = (appCounts[app.status] ?? 0) + 1;
  });

  const handleViewDetails = async (applicationId: string) => {
    setDetailsLoadingId(applicationId);

    try {
      const response = await getApplicationById(applicationId);
      setSelectedApp(mapApplicationDetails(response.data));
    } catch (error) {
      setNotification({
        type: "error",
        text: getMessage(error, "Failed to load application details."),
      });
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      const response = await withdrawApplication(id);
      const withdrawnAt = formatDate(response.data.withdrawnAt);
      const updatedAt = formatDate(response.data.updatedAt);

      // Keep both list and open detail panel synchronized after withdrawal.
      setApps((prev) =>
        prev.map((app) =>
          app.id === id
            ? {
                ...app,
                status: response.data.status,
              }
            : app
        )
      );

      setSelectedApp((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: response.data.status,
              withdrawnAt,
              updatedAt,
            }
          : prev
      );

      setNotification({ type: "success", text: response.message });
    } catch (error) {
      const message = getMessage(error, "Failed to withdraw application.");
      setNotification({ type: "error", text: message });
      throw error;
    }
  };

  return (
    <DashboardLayout role="student" title="My Applications" activeNav="applications">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              My Applications
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.82rem" }}>
              Track all your submitted job applications.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            <span className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
              {apps.length}
            </span>
            <span className="text-slate-500" style={{ fontSize: "0.82rem" }}>
              applications
            </span>
          </div>
        </div>

        <FilterChipGroup
          items={APP_FILTERS.map((opt) => ({
            ...opt,
            count: appCounts[opt.value] ?? 0,
            config: opt.value !== "all" ? APP_STATUS_CFG[opt.value] : undefined,
          }))}
          activeValue={appFilter}
          onChange={setAppFilter}
        />

        {loading ? (
          <ApplicationsLoading />
        ) : loadError ? (
          <ApplicationsError message={loadError} onRetry={loadApplications} />
        ) : filteredApps.length === 0 ? (
          <AppliedEmpty />
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filteredApps.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <AppCard
                    app={app}
                    onWithdraw={handleWithdraw}
                    onViewDetails={handleViewDetails}
                    loadingDetails={detailsLoadingId === app.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedApp && (
          <ViewDetailsPanel
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onWithdraw={handleWithdraw}
          />
        )}
      </AnimatePresence>

      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
