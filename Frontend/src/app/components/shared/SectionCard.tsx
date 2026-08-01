import { type ReactNode } from "react";

// Base card used for all content sections (activity, guides, tasks, etc.)
interface SectionCardProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  trailing,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-black/[0.05] shadow-sm p-6 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-900" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              {subtitle}
            </p>
          )}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}
