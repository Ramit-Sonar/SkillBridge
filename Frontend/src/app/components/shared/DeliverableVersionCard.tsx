import { Link } from "lucide-react";
import type { ProjectSubmission } from "../../data/projects";
import { FileAttachmentCard } from "./FileAttachmentCard";
import { getProjectSubmissionStatusBadgeLabel } from "./projectPresentation";
import { StatusBadge, type StatusBadgeConfig } from "./ui";

const SUBMISSION_STATUS_CFG: Record<ProjectSubmission["status"], StatusBadgeConfig> = {
  submitted: {
    label: getProjectSubmissionStatusBadgeLabel("submitted"),
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#8B5CF6",
  },
  revision_requested: {
    label: getProjectSubmissionStatusBadgeLabel("revision_requested"),
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  approved: {
    label: getProjectSubmissionStatusBadgeLabel("approved"),
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
};

type DeliverableVersionCardProps = {
  submission: ProjectSubmission;
};

export function DeliverableVersionCard({ submission }: DeliverableVersionCardProps) {
  const attachments = submission.attachments ?? [];
  const deliverableLinks = [
    { label: "Demo Link", url: submission.demoLink },
    { label: "Repository Link", url: submission.repositoryLink },
    { label: "Live URL", url: submission.liveUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));
  const hasFullDetails =
    Boolean(submission.notes) || deliverableLinks.length > 0 || attachments.length > 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
            {submission.label ?? `Version ${submission.versionNumber}`}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            Submitted on {submission.submittedAt}
          </p>
        </div>
        <StatusBadge config={SUBMISSION_STATUS_CFG[submission.status]} />
      </div>

      {submission.approvedAt && (
        <div className="bg-white border border-emerald-200 rounded-xl p-3">
          <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
            Approved On
          </p>
          <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
            {submission.approvedAt}
          </p>
        </div>
      )}

      {submission.notes ? (
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p
            className="text-slate-400 font-semibold mb-1"
            style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.07em" }}
          >
            Submission Notes
          </p>
          <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.8rem" }}>
            {submission.notes}
          </p>
        </div>
      ) : (
        <p className="text-slate-500" style={{ fontSize: "0.78rem" }}>
          {submission.label ?? `Version ${submission.versionNumber}`} was submitted on{" "}
          {submission.submittedAt}.
        </p>
      )}

      {deliverableLinks.map((item) => (
        <div
          key={`${submission.id}-${item.label}`}
          className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-3 py-2.5"
        >
          <Link className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
              {item.label}
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-medium hover:underline truncate block"
              style={{ fontSize: "0.78rem" }}
            >
              {item.url}
            </a>
          </div>
        </div>
      ))}

      {hasFullDetails && (
        <div className="flex flex-col gap-2">
          <p
            className="text-slate-400 font-semibold"
            style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.07em" }}
          >
            Attachments
          </p>
          {attachments.length > 0 ? (
            attachments.map((attachment) => (
              <FileAttachmentCard
                key={`${submission.id}-${attachment.originalName}`}
                attachment={attachment}
              />
            ))
          ) : (
            <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
              No files attached.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
