import { ExternalLink, GitPullRequest } from "lucide-react";
import type { RevisionRequest } from "../../data/projects";
import { FileAttachmentCard } from "./FileAttachmentCard";

type RevisionRequestCardProps = {
  request: RevisionRequest;
  viewerRole?: "student" | "client";
};

export function RevisionRequestCard({ request, viewerRole = "student" }: RevisionRequestCardProps) {
  const showRequestedBy = viewerRole !== "client";

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center">
            <GitPullRequest className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-amber-700 font-bold" style={{ fontSize: "0.92rem" }}>
              Revision Requested
            </h3>
            <p className="text-amber-600" style={{ fontSize: "0.72rem" }}>
              Revision #{request.revisionNumber}
            </p>
          </div>
        </div>
      </div>

      <div className={showRequestedBy ? "grid sm:grid-cols-2 gap-3" : "grid gap-3"}>
        {showRequestedBy && (
          <div className="bg-white border border-amber-200 rounded-xl p-3">
            <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
              Requested By
            </p>
            <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
              {request.requestedBy.name}
            </p>
          </div>
        )}
        <div className="bg-white border border-amber-200 rounded-xl p-3">
          <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
            Requested On
          </p>
          <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
            {request.requestedAt}
          </p>
        </div>
      </div>

      <div className="bg-white border border-amber-200 rounded-xl p-4">
        <p
          className="text-slate-400 font-semibold mb-1"
          style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.07em" }}
        >
          Revision Message
        </p>
        <p className="text-slate-700 leading-relaxed" style={{ fontSize: "0.82rem" }}>
          {request.message}
        </p>
      </div>

      {request.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p
            className="text-amber-700 font-semibold"
            style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.07em" }}
          >
            Supporting Attachments
          </p>
          {request.attachments.map((attachment) => (
            <FileAttachmentCard
              key={`${request.id}-${attachment.originalName}`}
              attachment={attachment}
            />
          ))}
        </div>
      )}

      {request.referenceLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          <p
            className="text-amber-700 font-semibold"
            style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.07em" }}
          >
            Reference Links
          </p>
          {request.referenceLinks.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-amber-200 text-blue-600 rounded-xl px-3 py-2 hover:underline"
              style={{ fontSize: "0.78rem" }}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{link}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
