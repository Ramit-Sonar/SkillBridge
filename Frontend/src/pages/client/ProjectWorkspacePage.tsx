import { useState, type ElementType } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  GitPullRequest,
  Lock,
  MessageSquare,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { DashboardLayout, type DashboardRole } from "../../app/components/layout/DashboardLayout";
import { ReviewModal } from "../../app/components/ReviewModal";
import { ReadOnlyApplicationView } from "../../app/components/shared/ApplicationDetailsContent";
import { DeliverableVersionCard } from "../../app/components/shared/DeliverableVersionCard";
import { FileUploadArea, type UploadedFile } from "../../app/components/shared/FileUploadArea";
import { ProjectOverview } from "../../app/components/shared/ProjectOverview";
import {
  ProjectSubmissionForm,
  type ProjectSubmissionFormData,
} from "../../app/components/shared/ProjectSubmissionForm";
import { RevisionRequestCard } from "../../app/components/shared/RevisionRequestCard";
import { SharedJobDetailsContent } from "../../app/components/shared/SharedJobDetailsContent";
import {
  StudentProfileView,
  type ProfileViewProps,
} from "../../app/components/shared/StudentProfileView";
import { Timeline } from "../../app/components/shared/Timeline";
import { ConfirmDialog, SidePanel } from "../../app/components/shared/ui";
import {
  PROJECTS,
  type Project,
  type ProjectFile,
  type ProjectStatus,
  type ProjectSubmission,
  type ProjectTimelineItem,
  type RevisionRequest,
} from "../../app/data/projects";

type ProjectWorkspaceTab = "overview" | "deliverables" | "activity" | "job" | "proposal";

const nowLabel = () =>
  new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function uploadedToProjectFile(file: UploadedFile): ProjectFile {
  return {
    url: "#",
    publicId: "",
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
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

function RevisionRequestDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { message: string; files: UploadedFile[]; referenceLinks: string[] }) => void;
}) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [referenceLinks, setReferenceLinks] = useState("");
  const [busy, setBusy] = useState(false);
  const canSubmit = message.trim().length > 0 && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;

    setBusy(true);
    setTimeout(() => {
      onSubmit({
        message: message.trim(),
        files,
        referenceLinks: referenceLinks
          .split("\n")
          .map((link) => link.trim())
          .filter(Boolean),
      });
    }, 700);
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
            <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
              Revision Message <span className="text-red-400">*</span>
            </label>
            <textarea
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
              maxFiles={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
              Reference Links <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={referenceLinks}
              onChange={(event) => setReferenceLinks(event.target.value)}
              placeholder="Add one reference link per line."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none"
              style={{ fontSize: "0.875rem" }}
            />
          </div>
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

function buildStudentProfile(project: Project): ProfileViewProps {
  return {
    name: project.student.name,
    initials: project.student.initials,
    headline: `${project.category} student contributor`,
    location: "Kathmandu, Nepal",
    education: "Bachelor in Computer Applications",
    university: "Tribhuvan University",
    bio: `${project.student.name} focuses on practical project delivery, clear communication, and revision-friendly handoff work.`,
    verified: true,
    skills: project.skills.map((skill, index) => ({ name: skill, verified: index < 2 })),
    rating: 4.8,
    reviewCount: 6,
    completedProjectsCount: 4,
    github: "github.com/skillbridge-student",
    linkedin: "linkedin.com/in/skillbridge-student",
    portfolio: "student-portfolio.example.com",
    projects: [
      {
        id: `${project.id}-portfolio-1`,
        title: project.title,
        category: project.category,
        description: "Current SkillBridge project workspace reference.",
        skills: project.skills,
        rating: project.status === "completed" ? 5 : 4.7,
      },
    ],
    certificates: [
      {
        id: `${project.id}-cert-1`,
        title: `${project.category} Fundamentals`,
        issuer: "SkillBridge Learning",
        issuedAt: "2026",
      },
    ],
    reviews: [
      {
        id: `${project.id}-review-1`,
        clientName: project.client.name,
        clientInitials: project.client.initials,
        rating: 5,
        comment: "Clear communication and strong attention to requested changes.",
        submittedAt: "Jun 2026",
      },
    ],
  };
}

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const role: DashboardRole = location.pathname.includes("/student/") ? "student" : "client";

  const projectData = PROJECTS.find((project) => project.id === id);

  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>("deliverables");
  const [status, setStatus] = useState<ProjectStatus>(projectData?.status ?? "active");
  const [lastUpdated, setLastUpdated] = useState(projectData?.lastUpdated ?? "");
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>(
    projectData?.submissions ?? []
  );
  const [revisionRequests, setRevisionRequests] = useState<RevisionRequest[]>(
    projectData?.revisionRequests ?? []
  );
  const [timeline, setTimeline] = useState<ProjectTimelineItem[]>(projectData?.timeline ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!projectData) {
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

  const latestSubmission = submissions[0];
  const olderSubmissions = submissions.slice(1);
  const latestRevisionRequest = revisionRequests[0];
  const revisionCount = revisionRequests.length;
  const readOnly = status === "completed";
  const studentProfile = buildStudentProfile(projectData);

  const tabs: { label: string; value: ProjectWorkspaceTab }[] = [
    { label: "Overview", value: "overview" },
    { label: "Deliverables", value: "deliverables" },
    { label: "Activity", value: "activity" },
    { label: "Job Details", value: "job" },
    { label: "Project Proposal", value: "proposal" },
  ];

  const handleSubmitProject = (formData: ProjectSubmissionFormData) => {
    setSubmitting(true);

    setTimeout(() => {
      const submittedAt = nowLabel();
      const versionNumber = submissions.length + 1;
      const nextSubmission: ProjectSubmission = {
        id: `dummy-submission-${Date.now()}`,
        versionNumber,
        status: "submitted",
        submittedAt,
        notes: formData.notes,
        demoLink: formData.demoLink,
        attachments: formData.files.map(uploadedToProjectFile),
      };

      setSubmissions((current) => [nextSubmission, ...current]);
      setStatus("submitted");
      setLastUpdated(submittedAt);
      setTimeline((current) => [
        ...current,
        {
          key: `v${versionNumber}-${Date.now()}`,
          label: `Version ${versionNumber} Submitted`,
          date: submittedAt,
          tone: "neutral",
        },
      ]);
      setSubmitting(false);
    }, 900);
  };

  const handleRequestRevision = (data: {
    message: string;
    files: UploadedFile[];
    referenceLinks: string[];
  }) => {
    const requestedAt = nowLabel();
    const nextRevisionNumber = revisionRequests.length + 1;
    const nextRequest: RevisionRequest = {
      id: `dummy-revision-${Date.now()}`,
      revisionNumber: nextRevisionNumber,
      requestedBy: projectData.client,
      requestedAt,
      message: data.message,
      attachments: data.files.map(uploadedToProjectFile),
      referenceLinks: data.referenceLinks,
    };

    setRevisionRequests((current) => [nextRequest, ...current]);
    setSubmissions((current) =>
      current.map((submission, index) =>
        index === 0 ? { ...submission, status: "revision_requested" } : submission
      )
    );
    setStatus("revision_requested");
    setLastUpdated(requestedAt);
    setTimeline((current) => [
      ...current,
      {
        key: `revision-${Date.now()}`,
        label: "Revision Requested",
        date: requestedAt,
        tone: "danger",
      },
    ]);
    setShowRevisionDialog(false);
  };

  const handleApprove = () => {
    const completedAt = nowLabel();
    setStatus("completed");
    setLastUpdated(completedAt);
    setSubmissions((current) =>
      current.map((submission, index) =>
        index === 0 ? { ...submission, status: "approved" } : submission
      )
    );
    setTimeline((current) => [
      ...current,
      { key: `approved-${Date.now()}`, label: "Approved", date: completedAt, tone: "success" },
      { key: `completed-${Date.now()}`, label: "Completed", date: completedAt, tone: "success" },
    ]);
    setShowApprove(false);
    setShowReview(true);
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
      {latestRevisionRequest && <RevisionRequestCard request={latestRevisionRequest} />}

      {role === "student" && status === "active" && (
        <ProjectSubmissionForm
          title="Submit Deliverables"
          helperMessage="Upload your files, add a demo link if available, and explain what the client should review."
          buttonLabel="Submit Project"
          submitting={submitting}
          onSubmit={handleSubmitProject}
        />
      )}

      {role === "student" && status === "revision_requested" && (
        <ProjectSubmissionForm
          title="Resubmit Deliverables"
          helperMessage="Use the same form to upload your revised files and explain what changed from the previous version."
          buttonLabel="Resubmit Project"
          submitting={submitting}
          onSubmit={handleSubmitProject}
        />
      )}

      {role === "student" && status === "submitted" && (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5">
          <EmptyState
            icon={MessageSquare}
            title="Waiting for Client Review"
            message="Your latest deliverables are submitted. The client can approve them or request a revision."
          />
        </section>
      )}

      {role === "client" && status === "active" && (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5">
          <EmptyState
            icon={FileText}
            title="Waiting for Student Submission"
            message="The student has not submitted deliverables yet."
          />
        </section>
      )}

      {role === "client" && status === "revision_requested" && (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5">
          <EmptyState
            icon={GitPullRequest}
            title="Waiting for Student Resubmission"
            message="A revision request has been sent. The student can now resubmit deliverables."
          />
        </section>
      )}

      {role === "client" && status === "submitted" && (
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

      {readOnly && (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5">
          <EmptyState
            icon={Lock}
            title="Project Completed"
            message="Deliverables are approved. This workspace is now read-only."
          />
          {role === "client" && !reviewSubmitted && (
            <button
              type="button"
              onClick={() => setShowReview(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-50 text-amber-600 font-semibold py-2.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
              style={{ fontSize: "0.875rem" }}
            >
              Leave a Review
            </button>
          )}
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
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <ProjectOverview
          project={projectData}
          status={status}
          role={role === "client" ? "client" : "student"}
          revisionCount={revisionCount}
          lastUpdated={lastUpdated}
          action={renderOverviewAction()}
          profileAction={
            role === "client" ? (
              <button
                type="button"
                onClick={() => setShowStudentProfile(true)}
                className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold py-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors"
                style={{ fontSize: "0.82rem" }}
              >
                View Student Profile
              </button>
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
          <Timeline items={timeline} />
        </section>
      );
    }

    if (activeTab === "job") {
      return (
        <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm overflow-hidden">
          <SharedJobDetailsContent job={projectData.job} showClientCard={role === "student"} />
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
          <div>
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
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-black/[0.05]">
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
            body={`Approve the latest deliverables for "${projectData.title}"?`}
            confirmLabel="Approve"
            confirmColor="#059669"
            onConfirm={handleApprove}
            onClose={() => setShowApprove(false)}
            icon={CheckCircle}
            iconBg="#ECFDF5"
            iconColor="#059669"
          />
        )}

        {showRevisionDialog && (
          <RevisionRequestDialog
            onClose={() => setShowRevisionDialog(false)}
            onSubmit={handleRequestRevision}
          />
        )}

        {showReview && (
          <ReviewModal
            studentName={projectData.student.name}
            studentInitials={projectData.student.initials}
            projectName={projectData.title}
            completedAt={lastUpdated}
            onClose={() => setShowReview(false)}
            onSubmit={() => {
              setReviewSubmitted(true);
              setShowReview(false);
            }}
          />
        )}

        {showStudentProfile && (
          <SidePanel
            title="Student Profile"
            subtitle={projectData.student.name}
            onClose={() => setShowStudentProfile(false)}
            maxWidthClassName="max-w-2xl"
            zIndexClassName="z-50"
            bodyClassName="flex-1 overflow-y-auto p-5"
          >
            <StudentProfileView profile={studentProfile} />
          </SidePanel>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
