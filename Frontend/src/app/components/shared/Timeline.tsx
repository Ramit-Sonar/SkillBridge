import { CheckCircle } from "lucide-react";

export type TimelineTone = "neutral" | "success" | "danger" | "muted";

export type TimelineItem = {
  key: string;
  label: string;
  date?: string;
  tone: TimelineTone;
};

const toneStyles: Record<TimelineTone, { bg: string; color: string; border: string }> = {
  neutral: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  success: { bg: "#ECFDF5", color: "#059669", border: "#6EE7B7" },
  danger: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  muted: { bg: "#F8FAFC", color: "#64748B", border: "#CBD5E1" },
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flex flex-col gap-0">
      {items.map((item, index) => {
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
  );
}
