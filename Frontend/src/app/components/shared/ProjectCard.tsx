import { Calendar, ChevronRight, Clock, GitPullRequest, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  PROJECT_STATUS_CFG,
  type ProjectStatus,
  type ProjectSubmissionStatus,
} from "../../data/projects";
import {
  formatProjectRelativeDate,
  getProjectCardAction,
  getProjectSubmissionStatusTitleLabel,
} from "./projectPresentation";
import { StatusBadge } from "./ui";

type ProjectCardPerson = {
  name: string;
  initials: string;
  avatar?: string;
};

type ProjectCardSubmission = {
  versionNumber: number;
  submittedAt: string;
  status: ProjectSubmissionStatus;
};

export type ProjectCardData = {
  id: string;
  title: string;
  status: ProjectStatus;
  category: string;
  student: ProjectCardPerson | null;
  client: ProjectCardPerson | null;
  deadline: string;
  budget: string;
  revisionCount: number;
  lastUpdated: string;
  currentAction?: string;
  submissions: ProjectCardSubmission[];
};

type ProjectCardProps = {
  project: ProjectCardData;
  role: "student" | "client";
};

function getLatestSubmissionSummary(submission?: ProjectCardSubmission) {
  if (!submission) {
    return {
      version: "None",
      detail: "No submission yet",
    };
  }

  return {
    version: `Version ${submission.versionNumber}`,
    detail: `${getProjectSubmissionStatusTitleLabel(submission.status)} ${formatProjectRelativeDate(
      submission.submittedAt
    )}`,
  };
}

export function ProjectCard({ project, role }: ProjectCardProps) {
  const navigate = useNavigate();
  const person = role === "student" ? project.client! : project.student!;
  const personLabel = role === "student" ? "Client" : "Student";
  const currentAction =
    project.currentAction ||
    getProjectCardAction(project.status, role, project.submissions.length > 0);
  const latestSubmission = getLatestSubmissionSummary(project.submissions[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:border-blue-200 p-4 flex flex-col gap-3.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="text-slate-900 leading-snug line-clamp-2"
            style={{ fontSize: "0.95rem", fontWeight: 800 }}
          >
            {project.title}
          </h3>
          <p className="text-slate-400 mt-1" style={{ fontSize: "0.68rem" }}>
            {project.category}
          </p>
        </div>
        <StatusBadge config={PROJECT_STATUS_CFG[project.status]} />
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
          {person.avatar ? (
            <img
              src={person.avatar}
              alt={person.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span style={{ fontSize: "0.72rem" }}>{person.initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-slate-900 font-semibold truncate" style={{ fontSize: "0.78rem" }}>
            {person.name}
          </p>
          <p className="text-slate-400" style={{ fontSize: "0.65rem" }}>
            {personLabel}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <p className="text-blue-600 font-semibold" style={{ fontSize: "0.62rem" }}>
          Current Action
        </p>
        <p className="text-slate-900 font-bold mt-0.5" style={{ fontSize: "0.8rem" }}>
          {currentAction}
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
            Latest Submission
          </p>
          <p className="text-slate-900 font-bold truncate" style={{ fontSize: "0.76rem" }}>
            {latestSubmission.version}
          </p>
        </div>
        <p className="text-slate-500 text-right shrink-0" style={{ fontSize: "0.7rem" }}>
          {latestSubmission.detail}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-slate-500">
        {[
          { icon: Calendar, label: `Due ${project.deadline}` },
          { icon: Tag, label: `Rs. ${project.budget}` },
          {
            icon: GitPullRequest,
            label: `${project.revisionCount} revision${project.revisionCount === 1 ? "" : "s"}`,
          },
          { icon: Clock, label: formatProjectRelativeDate(project.lastUpdated) },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 min-w-0">
            <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" style={{ fontSize: "0.7rem" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate(`/dashboard/${role}/projects/${project.id}`)}
        className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold py-2.5 rounded-xl border border-slate-200 hover:border-blue-200 transition-all duration-200"
        style={{ fontSize: "0.78rem" }}
      >
        Open Workspace <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
