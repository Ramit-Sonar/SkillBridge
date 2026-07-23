import { useEffect, useId, useRef, useState, type ElementType } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  AlertCircle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  FolderPlus,
  GitPullRequest,
  RefreshCw,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { DashboardLayout, type DashboardRole } from "../../app/components/layout/DashboardLayout";
import {
  ReadOnlyApplicationView,
  type ApplicationDetailsData,
} from "../../app/components/shared/ApplicationDetailsContent";
import { DeliverableVersionCard } from "../../app/components/shared/DeliverableVersionCard";
import { FileUploadArea, type UploadedFile } from "../../app/components/shared/FileUploadArea";
import { ProjectOverview } from "../../app/components/shared/ProjectOverview";
import {
  formatProjectRelativeDate,
  getProjectStateText,
} from "../../app/components/shared/projectPresentation";
import {
  ProjectSubmissionForm,
  type ProjectSubmissionFormData,
} from "../../app/components/shared/ProjectSubmissionForm";
import { RevisionRequestCard } from "../../app/components/shared/RevisionRequestCard";
import {
  SharedJobDetailsContent,
  type JobDetailData,
} from "../../app/components/shared/SharedJobDetailsContent";
import {
  StudentProfileView,
  type ProfileViewProps,
} from "../../app/components/shared/StudentProfileView";
import { ReportUserAction } from "../../app/components/shared/ReportUserAction";
import { buildStudentProfileViewProps } from "../../app/components/shared/studentProfileBuilder";
import { Timeline } from "../../app/components/shared/Timeline";
import {
  ConfirmDialog,
  Notification,
  StatusBadge,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import { ReviewModal } from "../../app/components/ReviewModal";
import {
  PROJECT_STATUS_CFG,
  type ProjectStatus,
  type ProjectSubmission,
  type ProjectTimelineItem,
  type RevisionRequest,
} from "../../app/data/projects";
import { JOB_CATEGORY_LABELS } from "../../constants/job.constants";
import {
  getProjectById,
  approveDeliverable,
  getProjectDeliverables,
  getProjectTimeline,
  requestRevision,
  submitDeliverable,
  type ProjectDeliverablesResponse,
  type ProjectDeliverable,
  type ProjectDeliverableHistoryItem,
  type ProjectTimelineEvent,
  type ProjectTimelineResponse,
  type ProjectRevisionRequest,
  type ProjectWorkspace,
} from "../../services/projectService";
import { createReview } from "../../services/reviewService";

type ProjectWorkspaceTab = "overview" | "deliverables" | "activity" | "job" | "proposal";

const CATEGORY_BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "web-dev": { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  "ui-ux": { bg: "#F0FDFA", color: "#0D9488", border: "#99F6E4" },
  graphic: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  documentation: { bg: "#ECFDF5", color: "#059669", border: "#6EE7B7" },
  presentation: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  other: { bg: "#F8FAFC", color: "#64748B", border: "#CBD5E1" },
};

const PROJECT_TIMELINE_PRESENTATION: Record<
  string,
  Pick<ProjectTimelineItem, "label" | "tone" | "icon">
> = {
  project_created: {
    label: "Project Created",
    tone: "primary",
    icon: FolderPlus,
  },
  deliverable_submitted: {
    label: "Deliverable Submitted",
    tone: "info",
    icon: Upload,
  },
  revision_requested: {
    label: "Revision Requested",
    tone: "warning",
    icon: RefreshCw,
  },
  deliverable_resubmitted: {
    label: "Deliverable Resubmitted",
    tone: "info",
    icon: Upload,
  },
  deliverable_approved: {
    label: "Deliverable Approved",
    tone: "success",
    icon: CheckCircle,
  },
  project_completed: {
    label: "Project Completed",
    tone: "success",
    icon: Award,
  },
};

function formatWorkspaceDate(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getJobStatus(status?: string): "open" | "closed" | "cancelled" {
  if (status === "closed" || status === "cancelled") return status;

  return "open";
}

type WorkspacePerson = {
  name: string;
  initials: string;
  avatar?: string;
};

type WorkspaceProject = {
  id: string;
  title: string;
  status: ProjectStatus;
  category: string;
  startDate: string;
  deadline: string;
  budget: string;
  completedAt: string;
  lastUpdated: string;
  student: WorkspacePerson | null;
  client: WorkspacePerson | null;
  job: JobDetailData;
  application: ApplicationDetailsData;
  studentProfile: ProfileViewProps | null;
};

type ProjectWorkspaceSnapshot = {
  projectData: WorkspaceProject;
  status: ProjectStatus;
  lastUpdated: string;
  submissions: ProjectSubmission[];
  revisionRequests: RevisionRequest[];
  timeline: ProjectTimelineItem[];
  canSubmitDeliverables: boolean;
};

function getProjectPerson(name?: string, avatar = ""): WorkspacePerson | null {
  if (!name) return null;

  return {
    name,
    initials: getInitials(name),
    avatar,
  };
}

function mapWorkspaceProject(
  workspace: ProjectWorkspace,
  role: DashboardRole
): WorkspaceProject | null {
  if (!workspace.job || !workspace.application) return null;

  // Normalize the backend workspace into the single shape used by every tab.
  const status = workspace.project.status;
  const partner = workspace.overview.partner;
  const partnerName = partner?.fullName || "";
  const partnerAvatar = partner?.avatar || "";
  const student =
    role === "client"
      ? getProjectPerson(
          workspace.studentProfile?.name || partnerName,
          workspace.studentProfile?.avatarUrl
        )
      : null;
  const client = role === "student" ? getProjectPerson(partnerName, partnerAvatar) : null;
  const budget = Number(workspace.job.budget);
  const budgetLabel = Number.isNaN(budget) ? String(workspace.job.budget) : budget.toLocaleString();

  return {
    id: workspace.project.id,
    title: workspace.job.title,
    status,
    category:
      JOB_CATEGORY_LABELS[workspace.job.category as keyof typeof JOB_CATEGORY_LABELS] ??
      workspace.job.category,
    student,
    client,
    startDate: formatWorkspaceDate(workspace.project.startedAt),
    deadline: formatWorkspaceDate(workspace.job.deadline),
    budget: budgetLabel,
    lastUpdated: formatWorkspaceDate(workspace.project.lastActivityAt),
    completedAt: formatWorkspaceDate(workspace.project.completedAt),
    job: {
      title: workspace.job.title,
      category: workspace.job.category,
      status: getJobStatus(workspace.job.status),
      description: workspace.job.description,
      requirements: workspace.job.requirements,
      skills: workspace.job.skills,
      budget: budgetLabel,
      duration: workspace.job.duration,
      deadline: formatWorkspaceDate(workspace.job.deadline),
      complexity: workspace.job.complexity,
      postedAt: formatWorkspaceDate(workspace.job.postedAt),
      attachedFiles: workspace.job.attachedFiles,
      clientName: workspace.job.clientName,
      clientInitials: workspace.job.clientInitials,
      clientAvatar: workspace.job.clientAvatar,
      clientLocation: workspace.job.clientLocation,
      clientCompanyName: workspace.job.clientCompanyName,
      clientWebsite: workspace.job.clientWebsite,
      clientAbout: workspace.job.clientAbout,
      clientVerified: workspace.job.clientVerified,
      clientJobsPosted: workspace.job.clientJobsPosted,
      clientProjectsCompleted: workspace.job.clientProjectsCompleted ?? undefined,
      clientJoinedDate: formatWorkspaceDate(workspace.job.clientJoinedDate),
      clientRating: workspace.job.clientRating ?? undefined,
    },
    application: {
      id: workspace.application.id,
      status: workspace.application.status as ApplicationDetailsData["status"],
      appliedAt: formatWorkspaceDate(workspace.application.appliedAt),
      updatedAt: formatWorkspaceDate(workspace.application.updatedAt),
      acceptedAt: formatWorkspaceDate(workspace.application.acceptedAt),
      rejectedAt: formatWorkspaceDate(workspace.application.rejectedAt),
      withdrawnAt: formatWorkspaceDate(workspace.application.withdrawnAt),
      estimatedTime: workspace.application.estimatedTime,
      coverMessage: workspace.application.coverMessage,
      whySuitable: workspace.application.whySuitable,
      attachments: workspace.application.attachments,
    },
    studentProfile:
      role === "client" && workspace.studentProfile
        ? buildStudentProfileViewProps({
            profile: workspace.studentProfile,
          })
        : null,
  };
}

function getCategoryBadge(project: WorkspaceProject) {
  const categoryKey = project.job.category;
  const label =
    JOB_CATEGORY_LABELS[categoryKey as keyof typeof JOB_CATEGORY_LABELS] ?? project.category;
  const style = CATEGORY_BADGE_STYLES[categoryKey] ?? CATEGORY_BADGE_STYLES.other;

  return { label, style };
}

function mapDeliverableSubmission(deliverable: ProjectDeliverable): ProjectSubmission {
  return {
    id: deliverable.id,
    versionNumber: deliverable.versionNumber,
    label: deliverable.label,
    status: deliverable.status,
    submittedAt: formatWorkspaceDate(deliverable.submittedAt),
    notes: deliverable.notes,
    demoLink: deliverable.demoLink,
    repositoryLink: deliverable.repositoryLink,
    liveUrl: deliverable.liveUrl,
    attachments: deliverable.attachments,
    approvedAt: formatWorkspaceDate(deliverable.approvedAt),
  };
}

function mapDeliverableHistoryItem(deliverable: ProjectDeliverableHistoryItem): ProjectSubmission {
  return {
    id: deliverable.id,
    versionNumber: deliverable.versionNumber,
    label: deliverable.label,
    status: deliverable.status,
    submittedAt: formatWorkspaceDate(deliverable.submittedAt),
  };
}

function mapRevisionRequest(revision: ProjectRevisionRequest): RevisionRequest {
  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    requestedBy: revision.requestedBy,
    requestedAt: formatWorkspaceDate(revision.requestedAt),
    message: revision.message,
    attachments: revision.attachments,
    referenceLinks: revision.referenceLinks,
    resolved: revision.resolved,
    resolvedAt: formatWorkspaceDate(revision.resolvedAt),
  };
}

function mapDeliverablesSnapshot(
  deliverables: ProjectDeliverablesResponse
): Pick<
  ProjectWorkspaceSnapshot,
  "status" | "canSubmitDeliverables" | "submissions" | "revisionRequests"
> {
  // Keep current deliverable first, followed by older versions for history.
  return {
    status: deliverables.project.status,
    canSubmitDeliverables: deliverables.project.canSubmit,
    submissions: [
      ...(deliverables.currentDeliverable
        ? [mapDeliverableSubmission(deliverables.currentDeliverable)]
        : []),
      ...deliverables.history.map(mapDeliverableHistoryItem),
    ],
    revisionRequests: deliverables.currentRevisionRequest
      ? [mapRevisionRequest(deliverables.currentRevisionRequest)]
      : [],
  };
}

function mapTimelineEvent(event: ProjectTimelineEvent, index: number): ProjectTimelineItem {
  const presentation = PROJECT_TIMELINE_PRESENTATION[event.type] ?? {
    label: event.message,
    tone: "neutral" as const,
    icon: CheckCircle,
  };

  return {
    key: `${event.type}-${event.referenceId ?? index}-${event.createdAt}`,
    label: presentation.label,
    description: event.message,
    actor: event.actor?.fullName,
    date: formatProjectRelativeDate(event.createdAt),
    fullDate: formatWorkspaceDate(event.createdAt),
    tone: presentation.tone,
    icon: presentation.icon,
  };
}

function mapTimelineSnapshot(timeline: ProjectTimelineResponse): ProjectTimelineItem[] {
  return timeline.timeline.map(mapTimelineEvent);
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: ElementType;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-300" />
      </div>
      <div>
        <p className="text-slate-900 font-bold" style={{ fontSize: "0.9rem" }}>
          {title}
        </p>
        <p className="text-slate-400 mt-1" style={{ fontSize: "0.8rem" }}>
          {message}
        </p>
      </div>
    </div>
  );
}

function getRevisionReferenceLinks(value: string) {
  const links = value
    .split("\n")
    .map((link) => link.trim())
    .filter(Boolean);

  const hasInvalidLink = links.some((link) => {
    try {
      const parsedUrl = new URL(link);
      return parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:";
    } catch {
      return true;
    }
  });

  if (hasInvalidLink) {
    throw new Error("Reference links must be valid URLs starting with http:// or https://.");
  }

  return links;
}

function RevisionRequestDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    message: string;
    files: UploadedFile[];
    referenceLinks: string[];
  }) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [referenceLinks, setReferenceLinks] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitLockedRef = useRef(false);
  const canSubmit = message.trim().length > 0 && !busy;
  const dialogId = useId();
  const messageId = `${dialogId}-revision-message`;
  const referenceLinksId = `${dialogId}-reference-links`;

  const handleSubmit = async () => {
    if (!canSubmit || submitLockedRef.current) return;

    submitLockedRef.current = true;
    setBusy(true);
    setError("");

    try {
      await onSubmit({
        message: message.trim(),
        files,
        referenceLinks: getRevisionReferenceLinks(referenceLinks),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Revision request could not be sent."
      );
    } finally {
      submitLockedRef.current = false;
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0 border-b border-black/[0.05]">
          <div>
            <h3 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
              Request Revision
            </h3>
            <p className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
              Explain what the student should change before resubmitting the deliverables.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close revision request dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={messageId}
              className="text-slate-900 font-semibold"
              style={{ fontSize: "0.82rem" }}
            >
              Revision Message <span className="text-red-400">*</span>
            </label>
            <textarea
              id={messageId}
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe exactly what needs to be changed."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none"
              style={{ fontSize: "0.875rem" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
              Supporting Attachments <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <FileUploadArea
              files={files}
              onAdd={(file) => setFiles((current) => [...current, file])}
              onRemove={(name) =>
                setFiles((current) => current.filter((file) => file.name !== name))
              }
              disabled={busy}
              maxFiles={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={referenceLinksId}
              className="text-slate-900 font-semibold"
              style={{ fontSize: "0.82rem" }}
            >
              Reference Links <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id={referenceLinksId}
              rows={3}
              value={referenceLinks}
              onChange={(event) => {
                setReferenceLinks(event.target.value);
                setError("");
              }}
              placeholder="Add one reference link per line."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none"
              style={{ fontSize: "0.875rem" }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-500 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 shrink-0 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:text-slate-900 transition-all disabled:opacity-60"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <motion.button
            type="button"
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-amber-600"
            style={{ fontSize: "0.875rem" }}
          >
            {busy ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              "Request Revision"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StudentProfileModal({
  profile,
  onClose,
}: {
  profile: ProfileViewProps;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              Student Profile
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              {profile.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            aria-label="Close student profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="w-full max-w-xl mx-auto">
            <StudentProfileView profile={profile} showReport={true} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const role: DashboardRole = location.pathname.includes("/student/") ? "student" : "client";

  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>("deliverables");
  const [workspace, setWorkspace] = useState<ProjectWorkspaceSnapshot | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [deliverablesLoaded, setDeliverablesLoaded] = useState(false);
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const reviewSubmitLockedRef = useRef(false);

  const loadProjectWorkspace = async () => {
    if (!id) {
      setWorkspace(null);
      setLoadingProject(false);
      return;
    }

    setLoadingProject(true);
    setLoadError("");
    setDeliverablesLoaded(false);
    setTimelineLoaded(false);
    setReviewSubmitted(false);

    try {
      const workspaceResponse = await getProjectById(id);
      const nextProject = mapWorkspaceProject(workspaceResponse.data, role);

      if (!nextProject) {
        throw new Error("Project details are incomplete.");
      }

      setReviewSubmitted(Boolean(workspaceResponse.data.project.hasReview));

      const nextWorkspace: ProjectWorkspaceSnapshot = {
        projectData: nextProject,
        status: nextProject.status,
        lastUpdated: nextProject.lastUpdated,
        canSubmitDeliverables: false,
        submissions: [],
        revisionRequests: [],
        timeline: [],
      };

      if (activeTab === "deliverables") {
        // Initial load fetches only the active tab's extra data.
        const deliverablesResponse = await getProjectDeliverables(id);
        Object.assign(nextWorkspace, mapDeliverablesSnapshot(deliverablesResponse.data));
        setDeliverablesLoaded(true);
      }

      if (activeTab === "activity") {
        // Timeline is lazy-loaded because most project visits start on deliverables.
        const timelineResponse = await getProjectTimeline(id);
        nextWorkspace.timeline = mapTimelineSnapshot(timelineResponse.data);
        setTimelineLoaded(true);
      }

      setWorkspace(nextWorkspace);
    } catch (error) {
      setWorkspace(null);
      setLoadError(error instanceof Error ? error.message : "Project could not be loaded.");
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    loadProjectWorkspace();
  }, [id, role]);

  const loadProjectDeliverables = async () => {
    if (!id || deliverablesLoaded) return;

    setLoadError("");

    try {
      const deliverablesResponse = await getProjectDeliverables(id);
      const deliverablesSnapshot = mapDeliverablesSnapshot(deliverablesResponse.data);

      setWorkspace((current) => (current ? { ...current, ...deliverablesSnapshot } : current));
      setDeliverablesLoaded(true);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Project deliverables could not be loaded."
      );
    }
  };

  const loadProjectTimeline = async () => {
    if (!id || timelineLoaded) return;

    setLoadError("");

    try {
      const timelineResponse = await getProjectTimeline(id);

      setWorkspace((current) =>
        current ? { ...current, timeline: mapTimelineSnapshot(timelineResponse.data) } : current
      );
      setTimelineLoaded(true);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Project timeline could not be loaded."
      );
    }
  };

  const refreshProjectAfterMutation = async () => {
    if (!id) return;

    setLoadError("");

    // After a mutation, refresh all dependent slices so status, timeline, and deliverables agree.
    const [workspaceResponse, deliverablesResponse, timelineResponse] = await Promise.all([
      getProjectById(id),
      getProjectDeliverables(id),
      getProjectTimeline(id),
    ]);
    const nextProject = mapWorkspaceProject(workspaceResponse.data, role);

    if (!nextProject) {
      throw new Error("Project details are incomplete.");
    }

    setReviewSubmitted(Boolean(workspaceResponse.data.project.hasReview));

    setWorkspace({
      projectData: nextProject,
      lastUpdated: nextProject.lastUpdated,
      timeline: mapTimelineSnapshot(timelineResponse.data),
      ...mapDeliverablesSnapshot(deliverablesResponse.data),
    });
    setDeliverablesLoaded(true);
    setTimelineLoaded(true);
  };

  useEffect(() => {
    if (!workspace) return;

    if (activeTab === "deliverables") {
      loadProjectDeliverables();
    }

    if (activeTab === "activity") {
      loadProjectTimeline();
    }
  }, [activeTab, workspace?.projectData.id]);

  if (loadingProject) {
    return (
      <DashboardLayout role={role} title="Project" activeNav="projects">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.span
            className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-500" style={{ fontSize: "0.85rem" }}>
            Loading project...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout role={role} title="Project" activeNav="projects">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
            Could not load project
          </p>
          <p className="text-slate-500 max-w-sm" style={{ fontSize: "0.85rem" }}>
            {loadError}
          </p>
          <button
            type="button"
            onClick={loadProjectWorkspace}
            className="text-blue-600 font-semibold hover:text-blue-700"
            style={{ fontSize: "0.875rem" }}
          >
            Try again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!workspace) {
    return (
      <DashboardLayout role={role} title="Project" activeNav="projects">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
            Project not found
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 font-semibold hover:text-blue-700"
            style={{ fontSize: "0.875rem" }}
          >
            Go back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const {
    projectData,
    status,
    lastUpdated,
    submissions,
    revisionRequests,
    timeline,
    canSubmitDeliverables,
  } = workspace;
  const latestSubmission = submissions[0];
  const olderSubmissions = submissions.slice(1);
  const latestRevisionRequest = revisionRequests[0];
  const studentProfile = projectData.studentProfile ?? null;
  const categoryBadge = getCategoryBadge(projectData);
  const projectStateText = getProjectStateText(status);

  const tabs: { label: string; value: ProjectWorkspaceTab }[] = [
    { label: "Overview", value: "overview" },
    { label: "Deliverables", value: "deliverables" },
    { label: "Activity", value: "activity" },
    { label: "Job Details", value: "job" },
    { label: "Project Proposal", value: "proposal" },
  ];

  const handleSubmitProject = async (formData: ProjectSubmissionFormData) => {
    if (!id || submitting) return;

    setSubmitting(true);
    setLoadError("");

    try {
      const response = await submitDeliverable(id, {
        notes: formData.notes,
        demoLink: formData.demoLink,
        repositoryLink: formData.repositoryLink,
        liveUrl: formData.liveUrl,
        files: formData.files.map((file) => file.file),
      });
      setNotification({ type: "success", text: response.message });

      try {
        await refreshProjectAfterMutation();
      } catch {
        setLoadError("Project submitted, but latest workspace data could not be refreshed.");
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Project could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async (data: {
    message: string;
    files: UploadedFile[];
    referenceLinks: string[];
  }) => {
    if (!id) return;

    try {
      const response = await requestRevision(id, {
        message: data.message,
        referenceLinks: data.referenceLinks,
        files: data.files.map((file) => file.file),
      });
      setShowRevisionDialog(false);
      setNotification({ type: "success", text: response.message });

      try {
        await refreshProjectAfterMutation();
      } catch {
        setLoadError("Revision request sent, but latest workspace data could not be refreshed.");
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Revision request could not be sent."
      );
    }
  };

  const handleApprove = async () => {
    if (!id) return;

    try {
      const response = await approveDeliverable(id);

      setShowApprove(false);
      setNotification({ type: "success", text: response.message });

      try {
        await refreshProjectAfterMutation();
        setActiveTab("overview");
        setTimeout(() => setShowReviewDialog(true), 600);
      } catch {
        setLoadError("Project approved, but latest workspace data could not be refreshed.");
      }
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Deliverables could not be approved.",
      });
      setShowApprove(false);
    }
  };

  const handleCreateReview = async (review: { rating: number; comment: string }) => {
    if (!id || reviewSubmitLockedRef.current) return;

    // Prevent duplicate review posts while the modal is awaiting the backend.
    reviewSubmitLockedRef.current = true;

    try {
      const response = await createReview(id, {
        rating: review.rating,
        comment: review.comment.trim(),
      });

      setReviewSubmitted(true);
      setNotification({ type: "success", text: response.message });
      await refreshProjectAfterMutation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Review could not be submitted.";
      setNotification({ type: "error", text: message });
      throw new Error(message);
    } finally {
      reviewSubmitLockedRef.current = false;
    }
  };

  const renderOverviewAction = () => {
    if (role === "student" && status === "active") {
      return (
        <button
          type="button"
          onClick={() => setActiveTab("deliverables")}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          <Upload className="w-4 h-4" /> Submit Deliverables
        </button>
      );
    }

    if (role === "student" && status === "revision_requested") {
      return (
        <button
          type="button"
          onClick={() => setActiveTab("deliverables")}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          <Upload className="w-4 h-4" /> Review Feedback and Resubmit
        </button>
      );
    }

    if (role === "client" && status === "submitted") {
      return (
        <button
          type="button"
          onClick={() => setActiveTab("deliverables")}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          <CheckCircle className="w-4 h-4" /> Review Deliverables
        </button>
      );
    }

    if (role === "client" && status === "completed" && !reviewSubmitted) {
      return (
        <button
          type="button"
          onClick={() => setShowReviewDialog(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          <Award className="w-4 h-4" /> Leave Review
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setActiveTab("deliverables")}
        className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
        style={{ fontSize: "0.82rem" }}
      >
        <FileText className="w-4 h-4" /> Open Deliverables
      </button>
    );
  };

  const renderDeliverablesTab = () => (
    <div className="flex flex-col gap-5">
      {!deliverablesLoaded ? (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5">
          <p className="text-slate-500 text-center py-6" style={{ fontSize: "0.85rem" }}>
            Loading deliverables...
          </p>
        </section>
      ) : (
        <>
          {latestRevisionRequest && (
            <RevisionRequestCard request={latestRevisionRequest} viewerRole={role} />
          )}

          {role === "student" && status === "active" && canSubmitDeliverables && (
            <ProjectSubmissionForm
              title="Submit Deliverables"
              helperMessage="Upload your files, add a demo link if available, and explain what the client should review."
              buttonLabel="Submit Project"
              submitting={submitting}
              onSubmit={handleSubmitProject}
            />
          )}

          {role === "student" && status === "revision_requested" && canSubmitDeliverables && (
            <ProjectSubmissionForm
              title="Resubmit Deliverables"
              helperMessage="Use the same form to upload your revised files and explain what changed from the previous version."
              buttonLabel="Resubmit Project"
              submitting={submitting}
              onSubmit={handleSubmitProject}
            />
          )}

          {role === "client" && status === "submitted" && latestSubmission && (
            <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4">
              <div>
                <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                  Review Submission
                </h2>
                <p className="text-slate-500 mt-1" style={{ fontSize: "0.78rem" }}>
                  Approve the deliverables or request changes with a clear revision message.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowApprove(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                  style={{ fontSize: "0.875rem" }}
                >
                  <CheckCircle className="w-4 h-4" /> Approve Deliverables
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowRevisionDialog(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-amber-600 font-semibold py-3 rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors"
                  style={{ fontSize: "0.875rem" }}
                >
                  <GitPullRequest className="w-4 h-4" /> Request Revision
                </motion.button>
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                Deliverables
              </h2>
              <p className="text-slate-500 mt-1" style={{ fontSize: "0.78rem" }}>
                Latest submission is shown first. Older versions stay available for history.
              </p>
            </div>

            {latestSubmission ? (
              <>
                <div>
                  <p
                    className="text-slate-400 font-semibold mb-2"
                    style={{
                      fontSize: "0.62rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Latest Submission
                  </p>
                  <DeliverableVersionCard submission={latestSubmission} />
                </div>

                {olderSubmissions.length > 0 && (
                  <details className="group">
                    <summary
                      className="cursor-pointer text-blue-600 font-semibold hover:text-blue-700"
                      style={{ fontSize: "0.82rem" }}
                    >
                      Version History ({olderSubmissions.length})
                    </summary>
                    <div className="flex flex-col gap-3 mt-3">
                      {olderSubmissions.map((submission) => (
                        <DeliverableVersionCard key={submission.id} submission={submission} />
                      ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Deliverables Submitted"
                message="Submitted files and notes will appear here."
              />
            )}
          </section>
        </>
      )}
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <ProjectOverview
          project={{
            status,
            startedAt: projectData.startDate,
            completedAt: projectData.completedAt,
            deadline: projectData.deadline,
            budget: projectData.budget,
            partner: role === "student" ? projectData.client : projectData.student,
          }}
          status={status}
          role={role === "client" ? "client" : "student"}
          lastUpdated={lastUpdated}
          action={renderOverviewAction()}
          profileAction={
            role === "client" && studentProfile ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentProfile(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold py-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors"
                  style={{ fontSize: "0.82rem" }}
                >
                  View Student Profile
                </button>
                <ReportUserAction
                  reportedUserName={studentProfile.name}
                  reportedUserRole="student"
                />
              </div>
            ) : role === "student" && projectData.client ? (
              <ReportUserAction
                reportedUserName={projectData.client.name}
                reportedUserRole="client"
              />
            ) : null
          }
        />
      );
    }

    if (activeTab === "deliverables") return renderDeliverablesTab();

    if (activeTab === "activity") {
      return (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5">
          <h2 className="text-slate-900 font-bold mb-4" style={{ fontSize: "0.95rem" }}>
            Project Timeline
          </h2>
          {!timelineLoaded ? (
            <p className="text-slate-500 text-center py-6" style={{ fontSize: "0.85rem" }}>
              Loading timeline...
            </p>
          ) : timeline.length > 0 ? (
            <Timeline items={timeline} />
          ) : (
            <EmptyState
              icon={Clock}
              title="No Timeline Events"
              message="Project activity will appear here when backend events are recorded."
            />
          )}
        </section>
      );
    }

    if (activeTab === "job") {
      return (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm overflow-hidden">
          <SharedJobDetailsContent
            job={projectData.job}
            showClientCard={role === "student"}
            showClientReportAction={role === "student"}
          />
        </section>
      );
    }

    if (activeTab === "proposal") {
      return (
        <section className="bg-slate-50 rounded-2xl border border-black/[0.05] shadow-sm">
          <ReadOnlyApplicationView application={projectData.application} />
        </section>
      );
    }

    return null;
  };

  return (
    <DashboardLayout role={role} title={projectData.title} activeNav="projects">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-5"
      >
        <button
          onClick={() => navigate(`/dashboard/${role}/projects`)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors w-fit"
          style={{ fontSize: "0.8rem" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </button>

        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 font-bold"
              style={{
                background: categoryBadge.style.bg,
                color: categoryBadge.style.color,
                borderColor: categoryBadge.style.border,
                fontSize: "0.68rem",
              }}
            >
              {categoryBadge.label}
            </span>
            <StatusBadge config={PROJECT_STATUS_CFG[status]} />
          </div>

          <div className="border-t border-black/[0.05] pt-4">
            <h1
              className="text-slate-900 tracking-tight"
              style={{
                fontSize: "clamp(1.05rem, 2vw, 1.3rem)",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {projectData.title}
            </h1>
            <p className="text-slate-500 font-semibold mt-1.5" style={{ fontSize: "0.82rem" }}>
              {projectStateText}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Started", value: projectData.startDate, icon: Calendar },
              { label: "Deadline", value: projectData.deadline, icon: Clock },
              { label: "Budget", value: `Rs. ${projectData.budget}`, icon: Tag },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-black/[0.04]"
              >
                <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
                    {item.label}
                  </p>
                  <p
                    className="text-slate-900 font-semibold truncate"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.value}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.value)}
              aria-pressed={activeTab === tab.value}
              className="px-4 py-2 rounded-xl border font-semibold whitespace-nowrap transition-all duration-200"
              style={{
                background: activeTab === tab.value ? "#EFF6FF" : "#F8FAFC",
                color: activeTab === tab.value ? "#2563EB" : "#64748B",
                borderColor: activeTab === tab.value ? "#BFDBFE" : "#E2E8F0",
                fontSize: "0.78rem",
              }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showApprove && (
          <ConfirmDialog
            title="Approve Deliverables"
            body={
              <>
                Approve the latest deliverables for <strong>{projectData.title}</strong>? Once
                approved, this project will be marked as completed and no further submissions or
                revision requests will be allowed.
              </>
            }
            confirmLabel="Approve"
            confirmColor="#059669"
            onConfirm={handleApprove}
            onClose={() => setShowApprove(false)}
            icon={CheckCircle}
            iconBg="#ECFDF5"
            iconColor="#059669"
            busyDelayMs={0}
          />
        )}

        {showRevisionDialog && (
          <RevisionRequestDialog
            onClose={() => setShowRevisionDialog(false)}
            onSubmit={handleRequestRevision}
          />
        )}

        {showStudentProfile && studentProfile && (
          <StudentProfileModal
            profile={studentProfile}
            onClose={() => setShowStudentProfile(false)}
          />
        )}

        {showReviewDialog && (
          <ReviewModal
            studentName={projectData.student?.name || studentProfile?.name || "Student"}
            studentInitials={projectData.student?.initials || studentProfile?.initials || "ST"}
            projectName={projectData.title}
            completedAt={projectData.completedAt || "Completed"}
            onClose={() => setShowReviewDialog(false)}
            onSubmit={handleCreateReview}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
