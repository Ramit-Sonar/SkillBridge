import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { ConfirmDialog, SearchInput, StatusBadge } from "../../app/components/shared/ui";
import {
  Briefcase,
  Tag,
  Calendar,
  Users,
  Trash2,
  Eye,
  ChevronDown,
  CheckCircle,
  X,
} from "lucide-react";
import { SharedJobDetailsContent } from "../../app/components/shared/SharedJobDetailsContent";

type JobStatus = "open" | "closed";

interface AdminJob {
  id: string;
  title: string;
  clientName: string;
  clientInitials: string;
  category: string;
  budget: string;
  duration: string;
  deadline: string;
  complexity: "small" | "medium";
  status: JobStatus;
  postedAt: string;
  applications: number;
  description: string;
  requirements: string;
  skills: string[];
}

const JOBS: AdminJob[] = [
  {
    id: "j1",
    title: "Landing Page Design",
    clientName: "Dikshya Khanal",
    clientInitials: "DK",
    category: "UI/UX Design",
    budget: "NPR 8,000",
    duration: "7d",
    deadline: "2026-06-30",
    complexity: "medium",
    status: "open",
    postedAt: "13 Jun 2026",
    applications: 5,
    description:
      "Design a modern, conversion-focused landing page for an online learning platform.",
    requirements:
      "Use brand colors (blue and white). Include hero, features, testimonials, and CTA. Deliver Figma prototype + exported assets.",
    skills: ["Figma", "UI Design", "Prototyping"],
  },
  {
    id: "j4",
    title: "Social Media Design Kit",
    clientName: "Dikshya Khanal",
    clientInitials: "DK",
    category: "Graphic Design",
    budget: "NPR 3,500",
    duration: "3d",
    deadline: "2026-06-27",
    complexity: "small",
    status: "closed",
    postedAt: "1 Jun 2026",
    applications: 4,
    description:
      "Create 20 branded social media post templates for Instagram, Facebook, and LinkedIn.",
    requirements:
      "Templates for announcements, quotes, product features. All editable in Canva. Export as PNG + Canva share links.",
    skills: ["Canva", "Graphic Design"],
  },
];

// Admin jobs are currently local fixtures; removal only affects this screen state.
const STATUS_CFG: Record<JobStatus, { label: string; color: string; bg: string; border: string }> =
  {
    open: { label: "Open", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
    closed: {
      label: "Closed",
      color: "#64748B",
      bg: "#F8FAFC",
      border: "#E2E8F0",
    },
  };

function JobDetailsPanel({
  job,
  onClose,
  onRemove,
}: {
  job: AdminJob;
  onClose: () => void;
  onRemove: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl h-[90vh] max-h-[90vh] bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-job-details-title"
      >
        <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p
              id="admin-job-details-title"
              className="text-slate-900 font-bold"
              style={{ fontSize: "0.95rem" }}
            >
              Job Details
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              Admin view — read only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            aria-label="Close job details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <SharedJobDetailsContent
            job={{
              title: job.title,
              category: job.category,
              status: job.status,
              description: job.description,
              requirements: job.requirements,
              skills: job.skills,
              budget: job.budget,
              duration: job.duration,
              deadline: job.deadline,
              complexity: job.complexity,
              postedAt: job.postedAt,
              clientName: job.clientName,
              clientInitials: job.clientInitials,
              clientLocation: "Kathmandu, Nepal",
              clientAbout: "Posted jobs on SkillBridge.",
              clientJobsPosted: job.applications,
              clientProjectsCompleted: 3,
              clientJoinedDate: "Jun 2026",
            }}
            actions={
              confirmRemove ? (
                <>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setRemoving(true);
                      setTimeout(() => {
                        onRemove();
                        onClose();
                      }, 700);
                    }}
                    disabled={removing}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {removing ? (
                      <motion.span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    ) : (
                      "Remove Job"
                    )}
                  </motion.button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                  style={{ fontSize: "0.875rem" }}
                >
                  <Trash2 className="w-4 h-4" /> Remove Job
                </button>
              )
            }
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-semibold hover:border-slate-300 transition-colors"
        style={{ fontSize: "0.82rem" }}
      >
        {value} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-1 w-36 bg-white border border-black/[0.07] rounded-xl shadow-lg z-20 overflow-hidden py-1"
          >
            {["All", "Open", "Closed"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors ${value === opt ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                style={{ fontSize: "0.8rem" }}
              >
                {opt} {value === opt && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState(JOBS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<AdminJob | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminJob | null>(null);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || j.title.toLowerCase().includes(q) || j.clientName.toLowerCase().includes(q);
    const matchFilter = filter === "All" || j.status === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const removeJob = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const handleRemoveJob = (job: AdminJob) => {
    removeJob(job.id);
    setRemoveTarget(null);
    if (selected?.id === job.id) {
      setSelected(null);
    }
  };

  return (
    <DashboardLayout role="admin" title="Jobs" activeNav="jobs">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              Jobs
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Monitor and manage all platform job listings.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-600 font-semibold" style={{ fontSize: "0.78rem" }}>
              {jobs.length} jobs
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by job title or client name..."
            className="relative flex-1 min-w-[200px]"
            inputClassName="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm"
            style={{ fontSize: "0.85rem" }}
          />
          <StatusDropdown value={filter} onChange={setFilter} />
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              No Jobs Found
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((job, i) => {
              const cfg = STATUS_CFG[job.status];
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{
                    y: -2,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
                  }}
                  className="bg-white border border-black/[0.06] hover:border-blue-200 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold"
                          style={{ fontSize: "0.42rem" }}
                        >
                          {job.clientInitials}
                        </div>
                        <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                          {job.clientName}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      config={cfg}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-semibold shrink-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ fontSize: "0.75rem" }}>{job.budget}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ fontSize: "0.75rem" }}>{job.applications} applications</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ fontSize: "0.75rem" }}>Posted {job.postedAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-black/[0.04]">
                    <button
                      onClick={() => setSelected(job)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button
                      onClick={() => setRemoveTarget(job)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-all"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <JobDetailsPanel
            job={selected}
            onClose={() => setSelected(null)}
            onRemove={() => removeJob(selected.id)}
          />
        )}
        {removeTarget && (
          <ConfirmDialog
            title="Remove Job"
            body={
              <>
                Are you sure you want to remove{" "}
                <strong className="text-slate-900">"{removeTarget.title}"</strong>?
              </>
            }
            confirmLabel="Remove"
            confirmColor="#DC2626"
            icon={Trash2}
            iconBg="#FEF2F2"
            iconColor="#DC2626"
            onConfirm={() => handleRemoveJob(removeTarget)}
            onClose={() => setRemoveTarget(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
