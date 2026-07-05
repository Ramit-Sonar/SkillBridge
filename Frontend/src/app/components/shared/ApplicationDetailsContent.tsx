import { type ElementType, type ReactNode } from "react";
import { Calendar, CheckCircle, FileText, MessageSquare, Timer } from "lucide-react";
import { FileAttachmentCard, type FileAttachment } from "./FileAttachmentCard";
import { StatusBadge } from "./ui";

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface ApplicationDetailsData {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  estimatedTime: string;
  coverMessage: string;
  whySuitable: string;
  attachments?: FileAttachment[];
}

export const APPLICATION_STATUS_CFG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  accepted: {
    label: "Accepted",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
    dot: "#94A3B8",
  },
};

type TimelineItem = {
  key: string;
  label: string;
  date?: string;
  tone: "neutral" | "success" | "danger" | "muted";
};

function getApplicationTimeline(app: ApplicationDetailsData): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      key: "applied",
      label: "Applied",
      date: app.appliedAt,
      tone: "success",
    },
  ];

  if (app.status === "pending") {
    items.push({
      key: "pending",
      label: "Pending",
      date: app.updatedAt ?? app.appliedAt,
      tone: "neutral",
    });
  }

  if (app.acceptedAt) {
    items.push({
      key: "accepted",
      label: "Accepted",
      date: app.acceptedAt,
      tone: "success",
    });
  }

  if (app.rejectedAt) {
    items.push({
      key: "rejected",
      label: "Rejected",
      date: app.rejectedAt,
      tone: "danger",
    });
  }

  if (app.withdrawnAt) {
    items.push({
      key: "withdrawn",
      label: "Withdrawn",
      date: app.withdrawnAt,
      tone: "muted",
    });
  }

  return items;
}

function WorkspaceSection({
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  icon: ElementType;
  iconColor: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        <h3 className="text-slate-900 font-bold" style={{ fontSize: "0.8rem" }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function ApplicationSummary({ app }: { app: ApplicationDetailsData }) {
  const cfg = APPLICATION_STATUS_CFG[app.status];

  return (
    <section className="bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
            Application Summary
          </h3>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            Submitted application snapshot
          </p>
        </div>
        <StatusBadge
          config={cfg}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold"
          style={{ fontSize: "0.65rem" }}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { label: "Applied Date", value: app.appliedAt },
          { label: "Last Updated", value: app.updatedAt ?? app.appliedAt },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl border border-black/[0.04] p-3">
            <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
              {item.label}
            </p>
            <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.76rem" }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportingDocuments({ attachments }: { attachments?: FileAttachment[] }) {
  return (
    <WorkspaceSection icon={FileText} iconColor="#2563EB" title="Supporting Documents">
      {attachments && attachments.length > 0 ? (
        <div className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <FileAttachmentCard
              key={`${attachment.originalName}-${attachment.url}`}
              attachment={attachment}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-5">
          <FileText className="w-5 h-5 text-slate-300" />
          <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
            No supporting documents were submitted.
          </p>
        </div>
      )}
    </WorkspaceSection>
  );
}

function ApplicationTimeline({ app }: { app: ApplicationDetailsData }) {
  const toneStyles: Record<TimelineItem["tone"], { bg: string; color: string; border: string }> = {
    neutral: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    success: { bg: "#ECFDF5", color: "#059669", border: "#6EE7B7" },
    danger: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    muted: { bg: "#F8FAFC", color: "#64748B", border: "#CBD5E1" },
  };

  return (
    <WorkspaceSection icon={Calendar} iconColor="#7C3AED" title="Application Timeline">
      <div className="flex flex-col gap-0">
        {getApplicationTimeline(app).map((item, index, items) => {
          const style = toneStyles[item.tone];

          return (
            <div key={item.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="w-7 h-7 rounded-full border flex items-center justify-center"
                  style={{
                    background: style.bg,
                    borderColor: style.border,
                    color: style.color,
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </span>
                {index < items.length - 1 && (
                  <span className="w-px h-7" style={{ background: style.border }} />
                )}
              </div>
              <div className="pb-4 min-w-0">
                <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                  {item.label}
                </p>
                <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                  {item.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </WorkspaceSection>
  );
}

export function ApplicationDetailsContent({
  application,
  action,
}: {
  application: ApplicationDetailsData;
  action?: ReactNode;
}) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <ApplicationSummary app={application} />

      <WorkspaceSection icon={MessageSquare} iconColor="#2563EB" title="Cover Letter">
        <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.8rem" }}>
          {application.coverMessage}
        </p>
      </WorkspaceSection>

      <section className="bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Timer className="w-3.5 h-3.5 text-emerald-600" />
          <h3 className="text-slate-900 font-bold" style={{ fontSize: "0.8rem" }}>
            Estimated Completion Time
          </h3>
        </div>
        <span
          className="bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full border border-emerald-300 w-fit"
          style={{ fontSize: "0.72rem" }}
        >
          {application.estimatedTime}
        </span>
      </section>

      <WorkspaceSection icon={FileText} iconColor="#7C3AED" title="Why I'm Suitable">
        <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.8rem" }}>
          {application.whySuitable}
        </p>
      </WorkspaceSection>

      <SupportingDocuments attachments={application.attachments} />
      <ApplicationTimeline app={application} />
      {action}
    </div>
  );
}

export const ReadOnlyApplicationView = ApplicationDetailsContent;
