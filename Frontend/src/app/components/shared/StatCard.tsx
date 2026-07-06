import { motion } from "motion/react";
import { type ElementType } from "react";

interface StatCardProps {
  value: string | number;
  label: string;
  icon: ElementType;
  color: string;
  bg: string;
  delay?: number;
  onClick?: () => void;
}

export function StatCard({
  value,
  label,
  icon: Icon,
  color,
  bg,
  delay = 0,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-black/[0.05] hover:border-blue-200 shadow-sm p-4 flex flex-col gap-3 transition-all duration-300 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-slate-900 leading-none"
            style={{ fontSize: "1.6rem", fontWeight: 800 }}
          >
            {value}
          </p>
          <p
            className="text-slate-400 mt-1.5 leading-tight"
            style={{ fontSize: "0.72rem", fontWeight: 500 }}
          >
            {label}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

interface StatGridProps {
  stats: Omit<StatCardProps, "delay">[];
  columns?: string;
}

export function StatGrid({
  stats,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
}: StatGridProps) {
  return (
    <div>
      <p
        className="text-slate-500 mb-3 font-medium"
        style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}
      >
        Overview
      </p>
      <div className={`grid ${columns} gap-3`}>
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.06} />
        ))}
      </div>
    </div>
  );
}
