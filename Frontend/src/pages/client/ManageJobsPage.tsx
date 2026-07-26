import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import {
  ACCOUNT_SUSPENDED_MESSAGE,
  DashboardLayout,
  isAccountSuspended,
  useDashboardCurrentUser,
} from "../../app/components/layout/DashboardLayout";
import {
  ConfirmDialog,
  Notification,
  SearchInput,
  StatusBadge,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import {
  StudentProfileView,
  type ProfileViewProps,
} from "../../app/components/shared/StudentProfileView";
import { ReportUserAction } from "../../app/components/shared/ReportUserAction";
import { buildStudentProfileViewProps } from "../../app/components/shared/studentProfileBuilder";
import { StudentSummaryCard } from "../../app/components/shared/StudentSummaryCard";
import { SharedJobDetailsContent } from "../../app/components/shared/SharedJobDetailsContent";
import {
  ReadOnlyApplicationView,
  type ApplicationDetailsData,
  type ApplicationStatus,
} from "../../app/components/shared/ApplicationDetailsContent";
import { JOB_CATEGORY_LABELS } from "../../constants/job.constants";
import { cancelJob, getClientJobs, type JobData } from "../../services/jobService";
import {
  acceptApplication,
  getApplicationById,
  getJobApplications,
  rejectApplication,
  type ApplicantCard,
  type ApplicationDetails,
} from "../../services/applicationService";
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
  FolderOpen,
  Ban,
  ShieldCheck,
} from "lucide-react";

// Types

type JobStatus = "open" | "closed" | "cancelled" | "suspended";
type AppStatus = ApplicationStatus;

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
  headline: string;
  verified: boolean;
  skills: VerifiedSkill[];
  rating: number;
  reviewCount: number;
  completedProjects: number;
  bio: string;
  appliedAt: string;
  updatedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  estimatedTime?: string;
  coverMessage?: string;
  whySuitable?: string;
  attachments?: FileAttachment[];
  status: AppStatus;
  avatarUrl?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  profileCompleted?: boolean;
  job?: ApplicationDetails["job"];
  profileData: ProfileViewProps;
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
  applicationCount: number;
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
  const status =
    job.status === "closed" || job.status === "cancelled" || job.status === "suspended"
      ? job.status
      : "open";

  // Normalize backend job records into the shape expected by manage-job cards.
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
    applicationCount: job.applicationCount ?? 0,
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
  suspended: {
    label: "Suspended",
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
  accepted: { label: "Accepted", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
  rejected: {
    label: "Rejected",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
  },
};

const APP_STATUS_TO_DETAILS_STATUS: Record<AppStatus, ApplicationStatus> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

function formatApplicationDate(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name?: string) {
  if (!name) return "ST";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function isStudentVerified(student: ApplicantCard["student"] | ApplicationDetails["student"]) {
  return student?.verification.status === "approved" || Boolean(student?.verification.verifiedAt);
}

function mapApplicantFromApi(applicant: ApplicantCard): Applicant {
  const student = applicant.student;
  const profileData = buildStudentProfileViewProps({
    profile: student,
    fallbackName: "Unknown Student",
    fallbackBio: "No profile summary provided.",
  });
  const university = profileData.university || "University not provided";

  // Applicant cards use the same profile builder as full student profiles.
  return {
    id: applicant.applicationId,
    name: profileData.name,
    initials: profileData.initials,
    education: profileData.education || university,
    university,
    headline: profileData.headline || university,
    verified: profileData.verified,
    skills: profileData.skills,
    rating: profileData.rating ?? 0,
    reviewCount: profileData.reviewCount ?? 0,
    completedProjects: profileData.completedProjectsCount ?? 0,
    bio: profileData.bio,
    appliedAt: formatApplicationDate(applicant.appliedAt),
    status: applicant.status,
    avatarUrl: profileData.avatarUrl,
    github: profileData.github,
    linkedin: profileData.linkedin,
    portfolio: profileData.portfolio,
    profileCompleted: student?.profileCompleted,
    profileData,
  };
}

function mapApplicantDetailsFromApi(application: ApplicationDetails): Applicant {
  const student = application.student;
  const profileData = buildStudentProfileViewProps({
    profile: student,
    fallbackName: "Unknown Student",
    fallbackBio: "No profile summary provided.",
  });
  const university = profileData.university || "University not provided";

  return {
    id: application.applicationId,
    name: profileData.name,
    initials: profileData.initials,
    education: profileData.education || university,
    university,
    headline: profileData.headline || university,
    verified: profileData.verified,
    skills: profileData.skills,
    rating: profileData.rating ?? 0,
    reviewCount: profileData.reviewCount ?? 0,
    completedProjects: profileData.completedProjectsCount ?? 0,
    bio: profileData.bio,
    appliedAt: formatApplicationDate(application.appliedAt),
    updatedAt: formatApplicationDate(application.updatedAt),
    acceptedAt: formatApplicationDate(application.acceptedAt),
    rejectedAt: formatApplicationDate(application.rejectedAt),
    withdrawnAt: formatApplicationDate(application.withdrawnAt),
    estimatedTime: application.estimatedCompletionTime,
    coverMessage: application.coverMessage,
    whySuitable: application.whySuitable,
    attachments: application.attachments,
    status: application.status,
    avatarUrl: profileData.avatarUrl,
    github: profileData.github,
    linkedin: profileData.linkedin,
    portfolio: profileData.portfolio,
    profileCompleted: student?.profileCompleted,
    job: application.job,
    profileData,
  };
}

function getApplicantProfileData(applicant: Applicant): ProfileViewProps {
  return applicant.profileData;
}

function getApplicantApplicationData(applicant: Applicant): ApplicationDetailsData {
  return {
    id: applicant.id,
    status: APP_STATUS_TO_DETAILS_STATUS[applicant.status],
    appliedAt: applicant.appliedAt,
    updatedAt: applicant.updatedAt ?? applicant.appliedAt,
    acceptedAt: applicant.acceptedAt,
    rejectedAt: applicant.rejectedAt,
    withdrawnAt: applicant.withdrawnAt,
    estimatedTime: applicant.estimatedTime ?? "Not provided",
    coverMessage: applicant.coverMessage ?? "No cover letter was submitted.",
    whySuitable: applicant.whySuitable ?? "No suitability response was submitted.",
    attachments: applicant.attachments ?? [],
  };
}

// Three-dot menu

function CardMenu({
  onEdit,
  onCancel,
  editDisabled,
  editDisabledReason,
  cancelDisabled,
  cancelDisabledReason,
}: {
  onEdit: () => void;
  onCancel: () => void;
  editDisabled?: boolean;
  editDisabledReason?: string;
  cancelDisabled?: boolean;
  cancelDisabledReason?: string;
}) {
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
                disabled: editDisabled,
                title: editDisabledReason,
              },
              {
                icon: XCircle,
                label: "Cancel Job",
                onClick: onCancel,
                danger: true,
                disabled: cancelDisabled,
                title: cancelDisabledReason,
              },
            ].map(({ icon: Icon, label, onClick, danger, disabled, title }) => (
              <button
                key={label}
                disabled={disabled}
                title={title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (disabled) return;
                  setOpen(false);
                  onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
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

// Cancel job modal

function DeleteModal({
  jobTitle,
  onConfirm,
  onClose,
  loading,
}: {
  jobTitle: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      title="Cancel Job"
      body={
        <>
          Are you sure you want to cancel <strong className="text-slate-900">"{jobTitle}"</strong>?
          The job will stay in your records.
        </>
      }
      confirmLabel="Cancel Job"
      confirmColor="#DC2626"
      onConfirm={onConfirm}
      onClose={onClose}
      loading={loading}
      busyDelayMs={0}
    />
  );
}

// Applicant workspace modal

type ApplicantWorkspaceTab = "application" | "profile";

function ApplicantWorkspaceModal({
  applicant,
  jobTitle,
  onClose,
  onHire,
  onReject,
  actionLoading,
  showApplicantActions = true,
  showProjectButton = true,
}: {
  applicant: Applicant;
  jobTitle: string;
  onClose: () => void;
  onHire: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
  actionLoading?: boolean;
  showApplicantActions?: boolean;
  showProjectButton?: boolean;
}) {
  const [tab, setTab] = useState<ApplicantWorkspaceTab>("application");
  const [hireModal, setHireModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const appCfg = APP_STATUS_CFG[applicant.status];
  const profileData = getApplicantProfileData(applicant);
  const applicationData = getApplicantApplicationData(applicant);
  const tabs: { label: string; value: ApplicantWorkspaceTab }[] = [
    { label: "Application", value: "application" },
    { label: "Student Profile", value: "profile" },
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
          className="w-full max-w-4xl max-h-[90vh] bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-workspace-title"
        >
          {/* Header */}
          <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-center justify-between shrink-0">
            <div>
              <p
                id="applicant-workspace-title"
                className="text-slate-900 font-bold"
                style={{ fontSize: "0.95rem" }}
              >
                Applicant Details
              </p>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
                Applied on {applicant.appliedAt}
              </p>
              <StatusBadge
                config={appCfg}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold mt-2"
                style={{ fontSize: "0.65rem" }}
              />
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              aria-label="Close applicant workspace"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white border-b border-black/[0.05] px-5 py-3 flex gap-2 shrink-0">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className="px-4 py-1.5 rounded-full border font-semibold transition-all duration-200"
                aria-pressed={tab === item.value}
                style={{
                  background: tab === item.value ? "#EFF6FF" : "#F8FAFC",
                  color: tab === item.value ? "#2563EB" : "#64748B",
                  borderColor: tab === item.value ? "#BFDBFE" : "#E2E8F0",
                  fontSize: "0.78rem",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {tab === "application" ? (
                <motion.div
                  key="application"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ReadOnlyApplicationView
                    application={applicationData}
                    action={
                      <ReportUserAction
                        reportedUserId={profileData.id}
                        reportedUserName={applicant.name}
                        reportedUserRole="student"
                      />
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5"
                >
                  <StudentProfileView profile={profileData} showReport={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-white border-t border-black/[0.05] px-5 py-4 shrink-0">
            {showApplicantActions && applicant.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRejectModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                  style={{ fontSize: "0.85rem" }}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setHireModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                  style={{ fontSize: "0.85rem" }}
                >
                  <UserCheck className="w-4 h-4" /> Hire
                </motion.button>
              </div>
            )}

            {showProjectButton && applicant.status === "accepted" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard/client/projects")}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                style={{ fontSize: "0.85rem" }}
              >
                <FolderOpen className="w-4 h-4" /> Go To Project
              </motion.button>
            )}

            {applicant.status === "rejected" && (
              <div
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 font-semibold"
                style={{ fontSize: "0.85rem" }}
                aria-disabled="true"
              >
                <Ban className="w-4 h-4" /> Application Rejected
              </div>
            )}

            {applicant.status === "withdrawn" && (
              <div
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-semibold"
                style={{ fontSize: "0.85rem" }}
                aria-disabled="true"
              >
                <ShieldCheck className="w-4 h-4" /> Application Withdrawn
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hireModal && (
          <ConfirmDialog
            title="Hire Student"
            body={
              <>
                Are you sure you want to hire{" "}
                <strong className="text-slate-900">{applicant.name}</strong> for:
                <br />
                <strong className="text-slate-900">{jobTitle}</strong>
              </>
            }
            confirmLabel="Hire Student"
            confirmColor="#059669"
            onConfirm={async () => {
              await onHire();
              setHireModal(false);
            }}
            onClose={() => setHireModal(false)}
            loading={actionLoading}
            busyDelayMs={0}
          />
        )}
        {rejectModal && (
          <ConfirmDialog
            title="Reject Application"
            body="Are you sure you want to reject this application?"
            confirmLabel="Reject"
            confirmColor="#64748B"
            onConfirm={async () => {
              await onReject();
              setRejectModal(false);
            }}
            onClose={() => setRejectModal(false)}
            loading={actionLoading}
            busyDelayMs={0}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Application list

function ApplicationsPanel({
  job,
  onClose,
  onJobStatusChange,
  onApplicantsChange,
}: {
  job: Job;
  onClose: () => void;
  onJobStatusChange: (jobId: string, status: JobStatus) => void;
  onApplicantsChange: (jobId: string, applicants: Applicant[]) => void;
}) {
  const currentUser = useDashboardCurrentUser();
  const suspended = isAccountSuspended(currentUser);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [workspaceApplicant, setWorkspaceApplicant] = useState<Applicant | null>(null);
  const [hireTarget, setHireTarget] = useState<Applicant | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Applicant | null>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const isSuspendedJob = job.status === "suspended";

  const loadApplicants = useCallback(
    async ({ showLoading = true, preserveCurrentData = false } = {}) => {
      if (showLoading) setLoadingApplicants(true);
      setError("");

      try {
        const response = await getJobApplications(job.id);
        const applicantList = response.data.applicants.map(mapApplicantFromApi);

        // Keep the parent job card and any open applicant workspace in sync.
        setApplicants(applicantList);
        onApplicantsChange(job.id, applicantList);
        setWorkspaceApplicant((current) => {
          if (!current) return current;

          const refreshedApplicant = applicantList.find((applicant) => applicant.id === current.id);

          return refreshedApplicant ? { ...current, ...refreshedApplicant } : current;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load applications.";
        setNotification({ type: "error", text: message });

        if (!preserveCurrentData) {
          setError(message);
          setApplicants([]);
        }
      } finally {
        if (showLoading) setLoadingApplicants(false);
      }
    },
    [job.id, onApplicantsChange]
  );

  const loadApplicantDetails = useCallback(async (applicationId: string) => {
    setDetailsLoadingId(applicationId);

    try {
      const response = await getApplicationById(applicationId);
      setWorkspaceApplicant(mapApplicantDetailsFromApi(response.data));
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load application details.",
      });
    } finally {
      setDetailsLoadingId(null);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  useEffect(() => {
    const refreshApplicantData = () => {
      // Refresh on focus so applicant decisions made elsewhere are reflected here.
      loadApplicants({ showLoading: false, preserveCurrentData: true });

      if (workspaceApplicant) {
        loadApplicantDetails(workspaceApplicant.id);
      }
    };

    window.addEventListener("focus", refreshApplicantData);

    return () => {
      window.removeEventListener("focus", refreshApplicantData);
    };
  }, [loadApplicantDetails, loadApplicants, workspaceApplicant]);

  const handleViewDetails = async (applicationId: string) => {
    await loadApplicantDetails(applicationId);
  };

  const handleHire = async (applicant: Applicant) => {
    if (suspended) {
      setNotification({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      setHireTarget(null);
      return;
    }

    setActionLoading(true);

    try {
      const response = await acceptApplication(applicant.id);

      if (
        response.data.job.status === "open" ||
        response.data.job.status === "closed" ||
        response.data.job.status === "cancelled"
      ) {
        // Accepting an applicant closes the job on the backend.
        onJobStatusChange(response.data.job.jobId, response.data.job.status);
      }

      setNotification({ type: "success", text: response.message });
      setHireTarget(null);
      await loadApplicants({ showLoading: false, preserveCurrentData: true });
      await loadApplicantDetails(applicant.id);
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to accept application.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (applicant: Applicant) => {
    if (suspended) {
      setNotification({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      setRejectTarget(null);
      return;
    }

    setActionLoading(true);

    try {
      const response = await rejectApplication(applicant.id);

      setNotification({ type: "success", text: response.message });
      setRejectTarget(null);
      await loadApplicants({ showLoading: false, preserveCurrentData: true });
      await loadApplicantDetails(applicant.id);
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to reject application.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const applicantCountText = `${applicants.length} applicant${applicants.length !== 1 ? "s" : ""}`;

  if (workspaceApplicant) {
    return (
      <>
        <ApplicantWorkspaceModal
          applicant={workspaceApplicant}
          jobTitle={job.title}
          onClose={() => setWorkspaceApplicant(null)}
          onHire={() => handleHire(workspaceApplicant)}
          onReject={() => handleReject(workspaceApplicant)}
          actionLoading={actionLoading}
          showApplicantActions={!isSuspendedJob}
          showProjectButton
        />
        <Notification message={notification} onClose={() => setNotification(null)} />
      </>
    );
  }

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
          className="w-full max-w-2xl max-h-[90vh] bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="applications-list-title"
        >
          <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
            <div>
              <p
                id="applications-list-title"
                className="text-slate-900 font-bold"
                style={{ fontSize: "0.95rem" }}
              >
                Applications
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
                  {loadingApplicants ? "Loading applicants" : applicantCountText} for{" "}
                  <span className="text-slate-700 font-semibold">{job.title}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              aria-label="Close applications list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {loadingApplicants ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white border border-black/[0.06] rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="space-y-2">
                        <div className="w-32 h-3 rounded-full bg-slate-100 animate-pulse" />
                        <div className="w-44 h-3 rounded-full bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                    <div className="w-16 h-5 rounded-full bg-slate-100 animate-pulse" />
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex justify-end gap-2 pt-1 border-t border-black/[0.04]">
                    <div className="w-20 h-7 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="w-16 h-7 rounded-lg bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold" style={{ fontSize: "0.9rem" }}>
                  {error}
                </p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold" style={{ fontSize: "0.9rem" }}>
                  No applications received yet.
                </p>
              </div>
            ) : (
              applicants.map((applicant, index) => {
                const appCfg = APP_STATUS_CFG[applicant.status];
                const isDetailsLoading = detailsLoadingId === applicant.id;

                return (
                  <StudentSummaryCard
                    key={applicant.id}
                    initials={applicant.initials}
                    name={applicant.name}
                    education={applicant.education}
                    headline={applicant.headline}
                    verified={applicant.verified}
                    rating={applicant.rating}
                    reviewCount={applicant.reviewCount}
                    completedProjects={applicant.completedProjects}
                    skills={applicant.skills}
                    meta={`Applied ${applicant.appliedAt}${applicant.profileCompleted ? " - Profile Complete" : ""}`}
                    delay={index * 0.04}
                    badge={<StatusBadge config={appCfg} style={{ fontSize: "0.6rem" }} />}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => handleViewDetails(applicant.id)}
                          disabled={isDetailsLoading || actionLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ fontSize: "0.68rem" }}
                        >
                          <Eye className="w-3 h-3" />{" "}
                          {isDetailsLoading ? "Loading" : "View Details"}
                        </button>
                        {applicant.status === "pending" && !isSuspendedJob && (
                          <>
                            <button
                              type="button"
                              onClick={() => setHireTarget(applicant)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              style={{ fontSize: "0.68rem" }}
                            >
                              <UserCheck className="w-3 h-3" /> Hire
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(applicant)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
          <ConfirmDialog
            title="Hire Student"
            body={
              <>
                Are you sure you want to hire{" "}
                <strong className="text-slate-900">{hireTarget.name}</strong> for:
                <br />
                <strong className="text-slate-900">{job.title}</strong>
              </>
            }
            confirmLabel="Hire Student"
            confirmColor="#059669"
            onConfirm={() => handleHire(hireTarget)}
            onClose={() => setHireTarget(null)}
            loading={actionLoading}
            busyDelayMs={0}
          />
        )}
        {rejectTarget && (
          <ConfirmDialog
            title="Reject Application"
            body="Are you sure you want to reject this application?"
            confirmLabel="Reject"
            confirmColor="#64748B"
            onConfirm={() => handleReject(rejectTarget)}
            onClose={() => setRejectTarget(null)}
            loading={actionLoading}
            busyDelayMs={0}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
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
  const isSuspendedJob = job.status === "suspended";

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
        aria-labelledby="job-details-title"
      >
        <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p
              id="job-details-title"
              className="text-slate-900 font-bold"
              style={{ fontSize: "0.95rem" }}
            >
              Job Details
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              Read-only view
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
            showClientCard={false}
            job={{
              title: job.title,
              category: job.categoryKey,
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
            }}
            actions={
              <motion.button
                whileHover={!isSuspendedJob ? { scale: 1.02 } : {}}
                whileTap={!isSuspendedJob ? { scale: 0.97 } : {}}
                disabled={isSuspendedJob}
                title={
                  isSuspendedJob
                    ? "Suspended jobs are unavailable for application review."
                    : undefined
                }
                onClick={() => {
                  if (isSuspendedJob) return;
                  onClose();
                  onViewApplications();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                style={{ fontSize: "0.82rem" }}
              >
                <Users className="w-3.5 h-3.5" /> Applications ({job.applicationCount})
              </motion.button>
            }
          />
        </div>
      </motion.div>
    </motion.div>
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
            {["All", "Open", "Closed", "Suspended"].map((opt) => (
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
  const isSuspendedJob = job.status === "suspended";
  const editDisabledReason =
    job.status === "closed"
      ? "Closed jobs cannot be edited."
      : isSuspendedJob
        ? "Suspended jobs cannot be edited."
        : job.status === "cancelled"
          ? "Cancelled jobs cannot be edited."
          : job.applicationCount > 0
            ? "This job has already received applications and can no longer be edited."
            : "";
  const hasAcceptedApplication = job.applicants.some(
    (applicant) => applicant.status === "accepted"
  );
  const cancelDisabledReason =
    job.status === "closed"
      ? "Closed jobs cannot be cancelled."
      : isSuspendedJob
        ? "Suspended jobs cannot be cancelled."
        : job.status === "cancelled"
          ? "Job is already cancelled."
          : hasAcceptedApplication
            ? "Jobs with accepted applications cannot be cancelled."
            : "";
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
      attachedFiles: job.attachedFiles,
    },
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
      className="bg-white border border-black/[0.06] hover:border-blue-200 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-bold leading-tight" style={{ fontSize: "0.95rem" }}>
            {job.title}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>
            {job.category}
          </p>
          {isSuspendedJob && (
            <span
              className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-600 font-semibold"
              style={{ fontSize: "0.62rem" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Suspended
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge config={cfg} />
          <CardMenu
            onEdit={() => navigate("/dashboard/client/post-job", { state: editState })}
            onCancel={onCancel}
            editDisabled={Boolean(editDisabledReason)}
            editDisabledReason={editDisabledReason}
            cancelDisabled={Boolean(cancelDisabledReason)}
            cancelDisabledReason={cancelDisabledReason}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span style={{ fontSize: "0.75rem" }}>
            {job.applicationCount} Application
            {job.applicationCount !== 1 ? "s" : ""}
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
          whileHover={!isSuspendedJob ? { scale: 1.02 } : {}}
          whileTap={!isSuspendedJob ? { scale: 0.97 } : {}}
          disabled={isSuspendedJob}
          title={
            isSuspendedJob ? "Suspended jobs are unavailable for application review." : undefined
          }
          onClick={onViewApplications}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
          style={{ fontSize: "0.75rem" }}
        >
          <Users className="w-3.5 h-3.5" /> Applications ({job.applicationCount})
        </motion.button>
      </div>
    </motion.div>
  );
}

// Page

export default function ManageJobsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useDashboardCurrentUser();
  const suspended = isAccountSuspended(currentUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cancelTarget, setCancelTarget] = useState<Job | null>(null);
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [applicationsJob, setApplicationsJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const cancellingRef = useRef(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationMessage>(null);

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

  useEffect(() => {
    const routeState = location.state as { notification?: NotificationMessage } | null;

    if (!routeState?.notification) return;

    setNotification(routeState.notification);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleCancelJob = async () => {
    if (!cancelTarget || cancellingRef.current) return;
    if (suspended) {
      setNotification({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      setCancelTarget(null);
      return;
    }

    cancellingRef.current = true;
    setCancelling(true);

    try {
      await cancelJob(cancelTarget.id);
      setNotification({ type: "success", text: "Job cancelled successfully." });
      setCancelTarget(null);
      loadClientJobs();
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to cancel job.",
      });
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  };

  const handleApplicantsChange = useCallback((jobId: string, applicantList: Applicant[]) => {
    const updateJob = (job: Job) =>
      job.id === jobId
        ? { ...job, applicants: applicantList, applicationCount: applicantList.length }
        : job;

    // Update every open representation of the same job.
    setJobs((prev) => prev.map(updateJob));
    setDetailsJob((prev) => (prev ? updateJob(prev) : prev));
    setApplicationsJob((prev) => (prev ? updateJob(prev) : prev));
  }, []);

  const handleJobStatusChange = useCallback((jobId: string, status: JobStatus) => {
    const updateJob = (job: Job) => (job.id === jobId ? { ...job, status } : job);

    setJobs((prev) => prev.map(updateJob));
    setDetailsJob((prev) => (prev ? updateJob(prev) : prev));
    setApplicationsJob((prev) => (prev ? updateJob(prev) : prev));
  }, []);

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
            onConfirm={handleCancelJob}
            onClose={() => {
              if (!cancelling) setCancelTarget(null);
            }}
            loading={cancelling}
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
            onJobStatusChange={handleJobStatusChange}
            onApplicantsChange={handleApplicantsChange}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
