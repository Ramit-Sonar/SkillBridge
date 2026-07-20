import { CheckCircle, type LucideIcon } from "lucide-react";

export type TimelineTone =
  | "primary"
  | "info"
  | "warning"
  | "neutral"
  | "success"
  | "danger"
  | "muted";

export type TimelineItem = {
  key: string;
  label: string;
  description?: string;
  actor?: string;
  date?: string;
  fullDate?: string;
  tone: TimelineTone;
  icon?: LucideIcon;
};

const toneStyles: Record<TimelineTone, { bg: string; color: string; border: string }> = {
  primary: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  info: { bg: "#F0FDFA", color: "#0D9488", border: "#99F6E4" },
  warning: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  neutral: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  success: { bg: "#ECFDF5", color: "#059669", border: "#6EE7B7" },
  danger: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  muted: { bg: "#F8FAFC", color: "#64748B", border: "#CBD5E1" },
};

/**
 * Displays audit-style timeline entries with tone-driven status styling.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flex flex-col gap-0">
      {items.map((item, index) => {
        const style = toneStyles[item.tone];
        const Icon = item.icon ?? CheckCircle;

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
                <Icon className="w-3.5 h-3.5" />
              </span>
              {index < items.length - 1 && (
                <span className="w-px h-7" style={{ background: style.border }} />
              )}
            </div>
            <div className="pb-4 min-w-0">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.72rem" }}>
                  {item.description}
                </p>
              )}
              {item.actor && (
                <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                  By {item.actor}
                </p>
              )}
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                {item.date}
                {item.fullDate && item.fullDate !== item.date ? ` - ${item.fullDate}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
