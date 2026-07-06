import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { type ElementType } from "react";

interface QuickActionCardProps {
  icon: ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
  stat?: number | string;
  delay?: number;
  onClick?: () => void;
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  color,
  bg,
  stat,
  delay = 0,
  onClick,
}: QuickActionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group text-left bg-white rounded-2xl p-5 border border-black/[0.05] hover:border-blue-200 shadow-sm transition-all duration-300 w-full"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {stat != null && (
        <p className="text-slate-900 font-bold leading-none mb-1" style={{ fontSize: "1.75rem" }}>
          {stat}
        </p>
      )}
      <p className="text-slate-900 font-semibold mb-1" style={{ fontSize: "0.875rem" }}>
        {title}
      </p>
      <p className="text-slate-500 leading-snug" style={{ fontSize: "0.78rem" }}>
        {description}
      </p>
      <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span className="font-semibold" style={{ fontSize: "0.72rem", color }}>
          Go
        </span>
        <ArrowRight className="w-3 h-3" style={{ color }} />
      </div>
    </motion.button>
  );
}

interface QuickActionsGridProps {
  actions: Omit<QuickActionCardProps, "delay">[];
  columns?: string;
}

export function QuickActionsGrid({
  actions,
  columns = "sm:grid-cols-2 lg:grid-cols-4",
}: QuickActionsGridProps) {
  return (
    <div>
      <p
        className="text-slate-500 mb-3 font-medium"
        style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}
      >
        Quick Actions
      </p>
      <div className={`grid ${columns} gap-4`}>
        {actions.map((action, i) => (
          <QuickActionCard key={action.title} {...action} delay={i * 0.07} />
        ))}
      </div>
    </div>
  );
}
