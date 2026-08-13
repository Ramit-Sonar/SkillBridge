import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import {
  ACCOUNT_SUSPENDED_MESSAGE,
  DashboardLayout,
  isAccountSuspended,
  useDashboardCurrentUser,
} from "../../app/components/layout/DashboardLayout";
import { FileAttachmentCard } from "../../app/components/shared/FileAttachmentCard";
import { FileUploadArea, type UploadedFile } from "../../app/components/shared/FileUploadArea";
import { Notification, type NotificationMessage } from "../../app/components/shared/ui";
import { SettingsLayout } from "../../app/components/layout/SettingsLayout";
import { VerificationReminderCard } from "../../app/components/shared/VerificationReminderCard";
import { JOB_CATEGORIES } from "../../constants/job.constants";
import { createJob, updateJob } from "../../services/jobService";
import { type FileAttachment } from "../../utils/fileUtils";
import {
  Briefcase,
  X,
  CheckCircle,
  Layers,
  AlertCircle,
  Send,
  Search,
  Plus,
  ArrowRight,
} from "lucide-react";

// Config

const CATEGORIES = JOB_CATEGORIES;

const SKILL_GROUPS = [
  {
    group: "Development",
    skills: [
      "React",
      "Next.js",
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "TailwindCSS",
      "Node.js",
    ],
  },
  {
    group: "Design",
    skills: ["Figma", "Canva", "Adobe XD", "Illustrator", "Photoshop"],
  },
  {
    group: "Writing",
    skills: ["Technical Writing", "Content Writing", "Copywriting"],
  },
  {
    group: "Office Tools",
    skills: ["MS PowerPoint", "MS Word", "MS Excel", "Google Slides"],
  },
  {
    group: "Other",
    skills: ["Python", "Data Entry", "Video Editing", "Social Media"],
  },
];

const ALL_SKILLS = SKILL_GROUPS.flatMap((g) => g.skills);
const MIN_JOB_BUDGET = 500;
const MAX_JOB_BUDGET = 100000;

const CHIP_COLORS = [
  { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  { bg: "#F0FDFA", color: "#0D9488", border: "#99F6E4" },
  { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  { bg: "#FFF1F2", color: "#E11D48", border: "#FECDD3" },
  { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
];

const COMPLEXITY = [
  { value: "small", label: "Beginner" },
  { value: "medium", label: "Intermediate" },
];

const DURATIONS = [
  { value: "1d", label: "1 Day" },
  { value: "3d", label: "3 Days" },
  { value: "5d", label: "5 Days" },
  { value: "7d", label: "1 Week" },
  { value: "14d", label: "2 Weeks" },
];

type FormSection = "job-details" | "project-settings";

const NAV_ITEMS: { id: FormSection; label: string; icon: React.ElementType }[] = [
  { id: "job-details", label: "Job Details", icon: Briefcase },
  { id: "project-settings", label: "Project Settings", icon: Layers },
];

// Shared styles

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10";

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
        {text}
      </span>
      {required && (
        <span className="text-red-400" style={{ fontSize: "0.75rem" }}>
          *
        </span>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label text={label} required={required} />
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-slate-50 border rounded-xl px-4 py-3 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 pr-10 ${
            error ? "border-red-300" : "border-slate-200"
          } ${value === "" ? "text-slate-300" : "text-slate-900"}`}
          style={{ fontSize: "0.875rem" }}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-0.5">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "3.5px solid transparent",
              borderRight: "3.5px solid transparent",
              borderBottom: "3.5px solid #94A3B8",
            }}
          />
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "3.5px solid transparent",
              borderRight: "3.5px solid transparent",
              borderTop: "3.5px solid #94A3B8",
            }}
          />
        </div>
      </div>
      {error && (
        <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function CategorySelector({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedCategory = CATEGORIES.find((category) => category.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return CATEGORIES;

    const q = query.toLowerCase();
    return CATEGORIES.filter((category) => category.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectCategory = (categoryValue: string) => {
    onChange(categoryValue);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={open ? query : selectedCategory?.label || ""}
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
            hasError ? "border-red-300" : "border-slate-200"
          }`}
          style={{ fontSize: "0.875rem" }}
          placeholder="Search categories..."
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"
          >
            <div className="max-h-64 overflow-y-auto pr-1">
              {filtered.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {filtered.map((category) => {
                    const selected = category.value === value;
                    const color = CHIP_COLORS[0];
                    return (
                      <motion.button
                        key={category.value}
                        type="button"
                        onClick={() => selectCategory(category.value)}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                        style={{
                          background: selected ? color.bg : "transparent",
                          color: selected ? color.color : undefined,
                          fontSize: "0.82rem",
                        }}
                      >
                        <span>{category.label}</span>
                        {selected && (
                          <CheckCircle className="w-4 h-4" style={{ color: color.color }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <p className="px-3 py-4 text-slate-400" style={{ fontSize: "0.75rem" }}>
                  No category found.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Skills selector

function SkillSelector({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_SKILLS;
    const q = query.toLowerCase();
    return ALL_SKILLS.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggle = (skill: string) => {
    if (skills.includes(skill)) onChange(skills.filter((s) => s !== skill));
    else if (skills.length < 10) onChange([...skills, skill]);
  };

  const addCustom = () => {
    const s = query.trim();
    if (s && !skills.includes(s) && skills.length < 10) {
      onChange([...skills, s]);
      setQuery("");
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
    if (e.key === "Backspace" && !query && skills.length) onChange(skills.slice(0, -1));
  };

  const isCustom =
    query.trim() && !ALL_SKILLS.some((s) => s.toLowerCase() === query.toLowerCase().trim());

  return (
    <div ref={dropdownRef} className="flex flex-col gap-3">
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {skills.map((skill, i) => {
              const c = CHIP_COLORS[i % CHIP_COLORS.length];
              return (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border"
                  style={{
                    background: c.bg,
                    color: c.color,
                    borderColor: c.border,
                    fontSize: "0.75rem",
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => toggle(skill)}
                    className="hover:opacity-60 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKey}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-20 py-3 text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          style={{ fontSize: "0.875rem" }}
          placeholder="Search skills..."
        />
        {isCustom && (
          <button
            type="button"
            onClick={addCustom}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
            style={{ fontSize: "0.68rem" }}
          >
            <Plus className="w-2.5 h-2.5" /> Add
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"
          >
            <div className="max-h-64 overflow-y-auto pr-1">
              {filtered.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {filtered.map((skill) => {
                    const selected = skills.includes(skill);
                    const idx = skills.indexOf(skill);
                    const c = selected ? CHIP_COLORS[idx % CHIP_COLORS.length] : null;
                    return (
                      <motion.button
                        key={skill}
                        type="button"
                        onClick={() => toggle(skill)}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                        style={{
                          background: selected ? c!.bg : "transparent",
                          color: selected ? c!.color : undefined,
                          fontSize: "0.82rem",
                        }}
                      >
                        <span>{skill}</span>
                        {selected && (
                          <CheckCircle className="w-4 h-4" style={{ color: c!.color }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <p className="px-3 py-4 text-slate-400" style={{ fontSize: "0.75rem" }}>
                  No skill found. Press Enter to add "{query.trim()}".
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-slate-300" style={{ fontSize: "0.68rem" }}>
        {skills.length}/10 skills - press Enter to add custom skills
      </p>
    </div>
  );
}

// Main page

export default function PostJobPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useDashboardCurrentUser();
  const suspended = isAccountSuspended(currentUser);
  // Manage Jobs passes edit data through route state to reuse this form.
  const editJob = (location.state as { editJob?: Record<string, unknown> } | null)?.editJob as
    | {
        id: string;
        title: string;
        category: string;
        description: string;
        requirements: string;
        complexity: string;
        duration: string;
        budget: string;
        deadline: string;
        skills: string[];
        attachedFiles?: FileAttachment[];
      }
    | undefined;

  const isEditing = !!editJob;

  const [activeSection, setActiveSection] = useState<FormSection>("job-details");
  const [form, setForm] = useState({
    title: editJob?.title ?? "",
    category: editJob?.category ?? "",
    description: editJob?.description ?? "",
    requirements: editJob?.requirements ?? "",
    complexity: editJob?.complexity ?? "",
    duration: editJob?.duration ?? "",
    budget: editJob?.budget ?? "",
    deadline: editJob?.deadline ?? "",
  });
  const [skills, setSkills] = useState<string[]>(editJob?.skills ?? []);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const set = (key: string) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      delete n.submit;
      return n;
    });
  };

  // Validate Job Details section
  const validateJobDetails = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Job title is required.";
    if (!form.category) e.category = "Please select a category.";
    if (form.description.trim().length < 20)
      e.description = "Description must be at least 20 characters.";
    if (!form.requirements.trim()) e.requirements = "Client requirements are required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Validate Project Settings section
  const validateProjectSettings = () => {
    const e: Record<string, string> = {};
    const budgetAmount = Number(form.budget);

    if (!form.budget.trim()) e.budget = "Budget is required.";
    else if (Number.isNaN(budgetAmount)) e.budget = "Budget must be a valid amount.";
    else if (budgetAmount < MIN_JOB_BUDGET)
      e.budget = `Budget must be at least Rs. ${MIN_JOB_BUDGET.toLocaleString("en-IN")}.`;
    else if (budgetAmount > MAX_JOB_BUDGET)
      e.budget = `Budget cannot be more than Rs. ${MAX_JOB_BUDGET.toLocaleString("en-IN")}.`;
    if (!form.duration) e.duration = "Please select a duration.";
    if (!form.deadline) e.deadline = "Deadline is required.";
    if (!form.complexity) e.complexity = "Please select a complexity level.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (suspended) {
      setNotification({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      return;
    }

    if (validateJobDetails()) setActiveSection("project-settings");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publishing) return;
    if (suspended) {
      setNotification({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      return;
    }

    if (!validateProjectSettings()) return;
    setPublishing(true);

    try {
      if (isEditing) {
        // Existing attachments stay on the backend unless replacement files are selected.
        await updateJob(editJob.id, {
          ...form,
          skills,
          files: files.length > 0 ? files.map((file) => file.file) : undefined,
        });

        navigate("/dashboard/client/manage-jobs", {
          state: {
            notification: {
              type: "success",
              text: "Job updated successfully.",
            },
          },
        });
        return;
      }

      await createJob({
        ...form,
        skills,
        files: files.map((file) => file.file),
      });

      setPublished(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save job.";

      setErrors({
        submit: message,
      });

      if (isEditing) {
        setNotification({ type: "error", text: message });
      }
    } finally {
      setPublishing(false);
    }
  };

  // Success state
  if (published) {
    return (
      <DashboardLayout
        role="client"
        title={isEditing ? "Edit Job" : "Post a Job"}
        activeNav="post-job"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg mx-auto mt-16 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2
            className="text-slate-900 tracking-tight"
            style={{ fontSize: "1.5rem", fontWeight: 800 }}
          >
            {isEditing ? "Job Updated!" : "Job Published!"}
          </h2>
          <p
            className="text-slate-500 mt-2 leading-relaxed max-w-sm"
            style={{ fontSize: "0.9rem" }}
          >
            {isEditing
              ? "Your job listing has been updated successfully."
              : "Your listing is live. Verified students can now view and apply for your project."}
          </p>
          <div className="flex gap-3 mt-8">
            {isEditing ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard/client/manage-jobs")}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                style={{ fontSize: "0.875rem" }}
              >
                Back to Manage Jobs
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setPublished(false);
                  setActiveSection("job-details");
                  setForm({
                    title: "",
                    category: "",
                    description: "",
                    requirements: "",
                    complexity: "",
                    duration: "",
                    budget: "",
                    deadline: "",
                  });
                  setSkills([]);
                  setFiles([]);
                  setErrors({});
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                style={{ fontSize: "0.875rem" }}
              >
                Post Another Job
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/client")}
              className="inline-flex items-center gap-2 bg-white text-slate-500 font-semibold px-5 py-2.5 rounded-xl border border-slate-200 hover:text-slate-900 hover:border-slate-300 transition-all"
              style={{ fontSize: "0.875rem" }}
            >
              Back to Dashboard
            </motion.button>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  // Main layout
  return (
    <DashboardLayout
      role="client"
      title={isEditing ? "Edit Job" : "Post a Job"}
      activeNav="post-job"
    >
      <SettingsLayout
        navTitle={isEditing ? "Edit Job" : "Post a Job"}
        items={NAV_ITEMS}
        activeId={activeSection}
        onSelect={(item) => {
          if (item === "project-settings") {
            handleContinue();
          } else {
            setActiveSection("job-details");
          }
        }}
        topContent={
          <VerificationReminderCard
            description="Complete KYC verification to start posting jobs and build trust with students."
            settingsPath="/dashboard/client/settings"
          />
        }
        onSubmit={handleSubmit}
        contentMinHeightClassName="min-h-[500px]"
      >
        {activeSection === "job-details" ? (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                Job Details
              </h2>
              <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
                Provide clear information about the job opportunity.
              </p>
            </div>

            {/* Job Title */}
            <div className="flex flex-col gap-1.5">
              <Label text="Job Title" required />
              <input
                type="text"
                className={`${inputClass} ${errors.title ? "border-red-300 focus:border-red-400" : ""}`}
                placeholder="e.g. Design a Landing Page for my startup"
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
                style={{ fontSize: "0.875rem" }}
              />
              {errors.title && (
                <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label text="Category" required />
              <CategorySelector
                value={form.category}
                onChange={set("category")}
                hasError={Boolean(errors.category)}
              />
              {errors.category && (
                <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                  {errors.category}
                </p>
              )}
            </div>

            {/* Job Description */}
            <div className="flex flex-col gap-1.5">
              <Label text="Job Description" required />
              <textarea
                className={`${inputClass} resize-none ${errors.description ? "border-red-300" : ""}`}
                rows={5}
                placeholder={
                  "Describe your project requirements clearly.\nProvide enough detail for students to understand the work."
                }
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                style={{ fontSize: "0.875rem" }}
              />
              <p className="text-slate-300 text-right" style={{ fontSize: "0.68rem" }}>
                {form.description.length} chars
                {form.description.length > 0 && form.description.length < 20 && (
                  <span className="text-red-300 ml-1">(min 20)</span>
                )}
              </p>
              {errors.description && (
                <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Required Skills */}
            <div className="flex flex-col gap-1.5">
              <Label text="Required Skills" />
              <SkillSelector skills={skills} onChange={setSkills} />
            </div>

            {/* Client Requirements */}
            <div className="flex flex-col gap-1.5">
              <Label text="Client Requirements" required />
              <textarea
                className={`${inputClass} resize-none ${errors.requirements ? "border-red-300" : ""}`}
                rows={4}
                placeholder={
                  "Define expectations, deliverables, and technical instructions.\ne.g. Use React + Tailwind CSS. Mobile responsive. Provide source code on GitHub."
                }
                value={form.requirements}
                onChange={(e) => set("requirements")(e.target.value)}
                style={{ fontSize: "0.875rem" }}
              />
              {errors.requirements && (
                <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                  {errors.requirements}
                </p>
              )}
            </div>

            {/* Validation hint */}
            {Object.keys(errors).length > 0 && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-500 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                  {errors.submit ?? "Please fill in all required fields before continuing."}
                </p>
              </div>
            )}

            {/* Save & Continue */}
            <div className="pt-1 border-t border-black/[0.05]">
              <motion.button
                type="button"
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                style={{ fontSize: "0.875rem" }}
              >
                Save &amp; Continue <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                Project Settings
              </h2>
              <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
                Set the scope, timeline, and budget for your project.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 items-start">
              <div className="flex flex-col gap-5">
                {/* Budget */}
                <div className="flex flex-col gap-1.5">
                  <Label text="Budget" required />
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold select-none"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Rs.
                    </span>
                    <input
                      type="number"
                      min={MIN_JOB_BUDGET}
                      max={MAX_JOB_BUDGET}
                      className={`${inputClass} pl-12 ${errors.budget ? "border-red-300" : ""}`}
                      placeholder={`${MIN_JOB_BUDGET} - ${MAX_JOB_BUDGET}`}
                      value={form.budget}
                      onChange={(e) => set("budget")(e.target.value)}
                      style={{ fontSize: "0.875rem" }}
                    />
                  </div>
                  {errors.budget && (
                    <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                      {errors.budget}
                    </p>
                  )}
                </div>

                {/* Complexity */}
                <SelectField
                  label="Complexity"
                  value={form.complexity}
                  onChange={set("complexity")}
                  options={COMPLEXITY}
                  placeholder="Select complexity"
                  required
                  error={errors.complexity}
                />
              </div>

              <div className="flex flex-col gap-5">
                {/* Duration */}
                <SelectField
                  label="Duration"
                  value={form.duration}
                  onChange={set("duration")}
                  options={DURATIONS}
                  placeholder="Select duration"
                  required
                  error={errors.duration}
                />

                {/* Deadline */}
                <div className="flex flex-col gap-1.5">
                  <Label text="Deadline" required />
                  <input
                    type="date"
                    className={`${inputClass} ${errors.deadline ? "border-red-300" : ""}`}
                    value={form.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => set("deadline")(e.target.value)}
                    style={{ fontSize: "0.875rem", colorScheme: "light" }}
                  />
                  {errors.deadline && (
                    <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                      {errors.deadline}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Label text="Attachments" />
                <span className="text-slate-400 font-medium" style={{ fontSize: "0.72rem" }}>
                  Optional
                </span>
              </div>
              <FileUploadArea
                files={files}
                disabled={suspended}
                onAdd={(f) => setFiles((p) => [...p, f])}
                onRemove={(name) => setFiles((p) => p.filter((f) => f.name !== name))}
              />
              {isEditing && editJob?.attachedFiles && editJob.attachedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  {editJob.attachedFiles.map((attachment) => (
                    <FileAttachmentCard
                      key={`${attachment.originalName}-${attachment.url}`}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Validation hint */}
            {Object.keys(errors).length > 0 && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-500 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                  {errors.submit ?? "Please fill in all required fields."}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-1 border-t border-black/[0.05] flex flex-wrap items-center gap-3">
              <motion.button
                type="submit"
                disabled={publishing || suspended}
                title={suspended ? ACCOUNT_SUSPENDED_MESSAGE : undefined}
                whileHover={!publishing && !suspended ? { scale: 1.02 } : {}}
                whileTap={!publishing && !suspended ? { scale: 0.97 } : {}}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                style={{ fontSize: "0.875rem" }}
              >
                {suspended ? (
                  "Account Suspended"
                ) : publishing ? (
                  <>
                    <motion.span
                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    {isEditing ? "Saving..." : "Publishing..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isEditing ? "Save Changes" : "Post Job"}
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setActiveSection("job-details");
                }}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-500 font-semibold px-5 py-2.5 rounded-xl hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-all"
                style={{ fontSize: "0.875rem" }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(isEditing ? "/dashboard/client/manage-jobs" : "/dashboard/client")
                }
                className="text-slate-400 font-semibold hover:text-slate-500 transition-colors ml-auto"
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SettingsLayout>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
