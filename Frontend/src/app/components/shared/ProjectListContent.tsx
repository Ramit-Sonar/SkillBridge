import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ProjectCard, type ProjectCardData } from "./ProjectCard";

type ProjectListContentProps = {
  loading: boolean;
  loadError: string;
  projects: ProjectCardData[];
  role: "student" | "client";
  EmptyIcon: LucideIcon;
  onRetry: () => void;
};

/**
 * Renders the shared project list states for both student and client dashboards.
 */
export function ProjectListContent({
  loading,
  loadError,
  projects,
  role,
  EmptyIcon,
  onRetry,
}: ProjectListContentProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <motion.span
          className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-slate-500" style={{ fontSize: "0.85rem" }}>
          Loading projects...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
          <EmptyIcon className="w-9 h-9 text-slate-300" />
        </div>
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
            Could not load projects
          </p>
          <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
            {loadError}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
          <EmptyIcon className="w-9 h-9 text-slate-300" />
        </div>
        <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          No Projects Found
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.06 }}
          >
            <ProjectCard project={project} role={role} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
