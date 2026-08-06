import { type ReactNode } from "react";
import { motion } from "motion/react";
import { Star, ShieldCheck, CheckCircle } from "lucide-react";

export interface StudentSummaryCardProps {
  initials: string;
  name: string;
  avatarUrl?: string;
  headline: string;
  education?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  skills: { name: string; verified: boolean }[];
  /** Optional contextual badge shown top-right (e.g. application status) */
  badge?: ReactNode;
  /** Optional single-line context shown below the action row (e.g. "Applied 2 days ago") */
  meta?: string;
  /** Action buttons rendered at the bottom of the card */
  actions: ReactNode;
  /** Stagger delay for enter animation */
  delay?: number;
}

export function StudentSummaryCard({
  initials,
  name,
  avatarUrl,
  headline,
  education,
  verified,
  rating,
  reviewCount,
  completedProjects,
  skills,
  badge,
  meta,
  actions,
  delay = 0,
}: StudentSummaryCardProps) {
  const verifiedCount = skills.filter((s) => s.verified).length;
  const topSkills = skills.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
      className="bg-white border border-black/[0.06] hover:border-blue-200 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
            style={{ fontSize: "0.65rem" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.875rem" }}>
                {name}
              </p>
              {verified && (
                <span
                  className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                  style={{ fontSize: "0.62rem" }}
                >
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            {education && (
              <p className="text-slate-400" style={{ fontSize: "0.7rem" }}>
                {education}
              </p>
            )}
            <p className="text-slate-400" style={{ fontSize: "0.7rem" }}>
              {headline}
            </p>
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" fill="#F59E0B" color="#F59E0B" />
          <span className="text-slate-900 font-semibold" style={{ fontSize: "0.75rem" }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-slate-400" style={{ fontSize: "0.68rem" }}>
            ({reviewCount} Reviews)
          </span>
        </div>
        <span className="text-slate-300" style={{ fontSize: "0.65rem" }}>
          {"\u00b7"}
        </span>
        <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
          <strong className="font-semibold">{completedProjects}</strong> Completed Projects
        </span>
        <span className="text-slate-300" style={{ fontSize: "0.65rem" }}>
          {"\u00b7"}
        </span>
        <span className="text-emerald-600" style={{ fontSize: "0.72rem" }}>
          <strong className="font-semibold">{verifiedCount}</strong> Verified Skill
          {verifiedCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {topSkills.map((s) =>
          s.verified ? (
            <span
              key={s.name}
              className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-600 font-semibold px-2 py-0.5 rounded-lg"
              style={{ fontSize: "0.62rem" }}
            >
              <CheckCircle className="w-2.5 h-2.5" />
              {s.name}
            </span>
          ) : (
            <span
              key={s.name}
              className="bg-slate-50 border border-slate-200 text-slate-500 font-medium px-2 py-0.5 rounded-lg"
              style={{ fontSize: "0.62rem" }}
            >
              {s.name}
            </span>
          )
        )}
        {skills.length > 4 && (
          <span
            className="bg-slate-50 border border-slate-200 text-slate-400 font-medium px-2 py-0.5 rounded-lg"
            style={{ fontSize: "0.62rem" }}
          >
            +{skills.length - 4}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-black/[0.04]">
        {meta ? (
          <span className="text-slate-400" style={{ fontSize: "0.65rem" }}>
            {meta}
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">{actions}</div>
      </div>
    </motion.div>
  );
}
