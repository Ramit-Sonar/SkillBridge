import { Clock, GitPullRequest, MessageSquare } from "lucide-react";
import {
  PROJECT_STATUS_CFG,
  type Project,
  type ProjectStatus,
  type ProjectSubmission,
} from "../../data/projects";
import {
  formatProjectRelativeDate,
  getProjectOverviewAction,
  getProjectSubmissionStatusLabel,
} from "./projectPresentation";
import { StatusBadge } from "./ui";

type ProjectOverviewProps = {
  project: Project;
  status: ProjectStatus;
  role: "student" | "client";
  revisionCount: number;
  lastUpdated: string;
  action?: React.ReactNode;
  profileAction?: React.ReactNode;
};

function getLatestSubmission(submission?: ProjectSubmission) {
  if (!submission) {
    return {
      title: "None",
      detail: "No submission yet",
      titleDate: "",
    };
  }

  return {
    title: `Version ${submission.versionNumber}`,
    detail: `${getProjectSubmissionStatusLabel(submission.status)} - ${formatProjectRelativeDate(
      submission.submittedAt
    )}`,
    titleDate: submission.submittedAt,
  };
}

function StateItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-black/[0.04] min-w-0">
      <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
        {label}
      </p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}

export function ProjectOverview({
  project,
  status,
  role,
  revisionCount,
  lastUpdated,
  action,
  profileAction,
}: ProjectOverviewProps) {
  const latestSubmission = getLatestSubmission(project.submissions[0]);
  const currentAction = getProjectOverviewAction(status, role);
  const partner = role === "student" ? project.client : project.student;
  const partnerRole = role === "student" ? "Client" : "Student";
  const lastActivity = formatProjectRelativeDate(lastUpdated);

  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Project State
        </h2>
        <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-3">
          <StateItem label="Current Status">
            <StatusBadge config={PROJECT_STATUS_CFG[status]} />
          </StateItem>
          <StateItem label="Latest Submission">
            <div title={latestSubmission.titleDate}>
              <p className="text-slate-900 font-semibold truncate" style={{ fontSize: "0.76rem" }}>
                {latestSubmission.title}
              </p>
              <p className="text-slate-500 mt-0.5 truncate" style={{ fontSize: "0.7rem" }}>
                {latestSubmission.detail}
              </p>
            </div>
          </StateItem>
          <StateItem label="Revisions">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
              <GitPullRequest className="w-3.5 h-3.5 text-slate-400" />
              <span style={{ fontSize: "0.76rem" }}>{revisionCount}</span>
            </div>
          </StateItem>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Current Action Required
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </span>
            <span className="text-blue-700 font-bold" style={{ fontSize: "0.9rem" }}>
              {currentAction}
            </span>
          </div>
          {action}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Project Partner
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 overflow-hidden">
            {partner.avatar ? (
              <img src={partner.avatar} alt={partner.name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontSize: "0.78rem" }}>{partner.initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 font-semibold truncate" style={{ fontSize: "0.86rem" }}>
              {partner.name}
            </p>
            <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
              {partnerRole}
            </p>
          </div>
        </div>
        <div
          title={lastUpdated}
          className="flex items-center gap-2 text-slate-500 bg-slate-50 rounded-xl p-3 border border-black/[0.04]"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span style={{ fontSize: "0.74rem" }}>Last updated {lastActivity}</span>
        </div>
        {profileAction}
      </section>
    </div>
  );
}
