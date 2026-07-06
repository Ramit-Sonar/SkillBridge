import { Link } from "lucide-react";
import type { ProjectSubmission } from "../../data/projects";
import { FileAttachmentCard } from "./FileAttachmentCard";
import { StatusBadge, type StatusBadgeConfig } from "./ui";

const SUBMISSION_STATUS_CFG: Record<ProjectSubmission["status"], StatusBadgeConfig> = {
  submitted: {
    label: "Submitted",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#8B5CF6",
  },
  revision_requested: {
    label: "Revision Requested",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  approved: {
    label: "Approved",
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
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
            Version {submission.versionNumber}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            Submitted on {submission.submittedAt}
          </p>
        </div>
        <StatusBadge config={SUBMISSION_STATUS_CFG[submission.status]} />
      </div>

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

      {submission.demoLink && (
        <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-3 py-2.5">
          <Link className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <a
            href={submission.demoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-medium hover:underline truncate"
            style={{ fontSize: "0.78rem" }}
          >
            {submission.demoLink}
          </a>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p
          className="text-slate-400 font-semibold"
          style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.07em" }}
        >
          Attachments
        </p>
        {submission.attachments.length > 0 ? (
          submission.attachments.map((attachment) => (
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
    </div>
  );
}
