import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowRight, CheckCircle, Clock, Tag, X } from "lucide-react";
import { FileUploadArea, type UploadedFile } from "./shared/FileUploadArea";
import {
  JOB_CATEGORY_LABELS,
  JOB_DURATION_LABELS,
  JOB_SKILL_COLORS,
} from "../../constants/job.constants";
import { submitApplication } from "../../services/applicationService";
import type { BrowseJob } from "../../types";

interface ApplyModalProps {
  job: BrowseJob;
  onClose: () => void;
  onSubmitted?: (jobId: string, message: string) => void;
  onError?: (message: string) => void;
}

const TIME_OPTIONS = [
  { value: "1d", label: "1 Day" },
  { value: "3d", label: "3 Days" },
  { value: "5d", label: "5 Days" },
  { value: "7d", label: "7 Days" },
  { value: "14d", label: "2 Weeks" },
  { value: "custom", label: "Custom" },
];

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10";

function FieldLabel({
  htmlFor,
  text,
  required,
}: {
  htmlFor?: string;
  text: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-slate-900 font-semibold"
      style={{ fontSize: "0.82rem" }}
    >
      {text} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function TimeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      transition={{ duration: 0.12 }}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-semibold transition-all duration-200"
      style={{
        background: active ? "#EFF6FF" : "#F8FAFC",
        color: active ? "#2563EB" : "#64748B",
        borderColor: active ? "#2563EB" : "#E2E8F0",
        boxShadow: active ? "0 0 0 2px rgba(37,99,235,0.12)" : "none",
        fontSize: "0.8rem",
      }}
      aria-pressed={active}
    >
      {active && <CheckCircle className="w-3 h-3 text-blue-600" />}
      {label}
    </motion.button>
  );
}

function SkillChip({
  skill,
  index,
  fontSize = "0.65rem",
}: {
  skill: string;
  index: number;
  fontSize?: string;
}) {
  const color = JOB_SKILL_COLORS[index % JOB_SKILL_COLORS.length];

  return (
    <span
      className="px-2 py-0.5 rounded-lg font-semibold"
      style={{ background: color.bg, color: color.color, fontSize }}
    >
      {skill}
    </span>
  );
}

function getSubmitErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to submit application.";

  return message || "Network error. Please try again.";
}

export function ApplyModal({ job, onClose, onSubmitted, onError }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [whySuitable, setWhySuitable] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const canSubmit =
    coverLetter.trim().length > 0 &&
    whySuitable.trim().length > 0 &&
    estimatedTime.trim().length > 0 &&
    !submitting;

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    // Keep keyboard focus inside the modal while the application form is open.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }

      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [onClose, submitting]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!coverLetter.trim()) {
      nextErrors.coverLetter = "Cover letter is required.";
    }

    if (!estimatedTime.trim()) {
      nextErrors.estimatedCompletionTime = "Estimated completion time is required.";
    }

    if (!whySuitable.trim()) {
      nextErrors.whySuitable = "Please explain why you are suitable for this job.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (submitting || !validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      // Submit proposal text and optional files through the application service.
      const response = await submitApplication(job.id, {
        coverLetter: coverLetter.trim(),
        estimatedCompletionTime: estimatedTime.trim(),
        whySuitable: whySuitable.trim(),
        files: files.map((file) => file.file),
      });

      onSubmitted?.(response.data.jobId, response.message);
      onClose();
    } catch (error) {
      const message = getSubmitErrorMessage(error);
      setErrors({ submit: message });
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (setter: (value: string) => void, key: string) => (value: string) => {
    setter(value);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.submit;
      return next;
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget && !submitting) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
          style={{ maxWidth: 760, maxHeight: "92vh" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-job-title"
          ref={modalRef}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] shrink-0">
            <div>
              <h2
                id="apply-job-title"
                className="text-slate-900"
                style={{ fontSize: "1rem", fontWeight: 800 }}
              >
                Apply for this Job
              </h2>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
                Complete the form below to submit your application.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200 disabled:opacity-50"
              aria-label="Close apply job modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <motion.form
              id="apply-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl mx-auto p-6 flex flex-col gap-5"
            >
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                <p
                  className="text-slate-400 font-semibold"
                  style={{
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Applying for
                </p>
                <h3
                  className="text-slate-900 leading-snug"
                  style={{ fontSize: "0.9rem", fontWeight: 700 }}
                >
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                      Rs. {job.budget}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                      {JOB_DURATION_LABELS[job.duration] ?? job.duration}
                    </span>
                  </div>
                  <span
                    className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full"
                    style={{ fontSize: "0.62rem" }}
                  >
                    {JOB_CATEGORY_LABELS[job.category] ?? job.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 4).map((skill, index) => (
                    <SkillChip key={skill} skill={skill} index={index} fontSize="0.62rem" />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="coverLetter" text="Cover Letter" required />
                  <span className="text-slate-300" style={{ fontSize: "0.68rem" }}>
                    {coverLetter.length} chars
                  </span>
                </div>
                <textarea
                  id="coverLetter"
                  rows={4}
                  className={`${inputClass} resize-none ${errors.coverLetter ? "border-red-300 focus:border-red-400" : ""}`}
                  style={{ fontSize: "0.875rem" }}
                  placeholder="Write a short cover letter for the client..."
                  value={coverLetter}
                  onChange={(e) => setField(setCoverLetter, "coverLetter")(e.target.value)}
                  aria-invalid={Boolean(errors.coverLetter)}
                />
                {errors.coverLetter && (
                  <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                    {errors.coverLetter}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <FieldLabel text="Estimated Completion Time" required />
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Estimated completion time"
                >
                  {TIME_OPTIONS.map((option) => (
                    <TimeChip
                      key={option.value}
                      label={option.label}
                      active={estimatedTime === option.value}
                      onClick={() =>
                        setField(
                          setEstimatedTime,
                          "estimatedCompletionTime"
                        )(estimatedTime === option.value ? "" : option.value)
                      }
                    />
                  ))}
                </div>
                {errors.estimatedCompletionTime && (
                  <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                    {errors.estimatedCompletionTime}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="whySuitable" text="Why Are You Suitable?" required />
                <textarea
                  id="whySuitable"
                  rows={4}
                  className={`${inputClass} resize-none ${errors.whySuitable ? "border-red-300 focus:border-red-400" : ""}`}
                  style={{ fontSize: "0.875rem" }}
                  placeholder="Highlight your relevant skills, experience, and approach..."
                  value={whySuitable}
                  onChange={(e) => setField(setWhySuitable, "whySuitable")(e.target.value)}
                  aria-invalid={Boolean(errors.whySuitable)}
                />
                {errors.whySuitable && (
                  <p className="text-red-400" style={{ fontSize: "0.72rem" }}>
                    {errors.whySuitable}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <FieldLabel text="Optional Attachments" />
                  <span className="text-slate-400 font-medium" style={{ fontSize: "0.72rem" }}>
                    Resume, proposal, portfolio PDF or supporting documents
                  </span>
                </div>
                <FileUploadArea
                  files={files}
                  disabled={submitting}
                  onAdd={(file) => setFiles((prev) => [...prev, file])}
                  onRemove={(name) => setFiles((prev) => prev.filter((file) => file.name !== name))}
                />
              </div>

              {errors.submit && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-500 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                    {errors.submit}
                  </p>
                </div>
              )}
            </motion.form>
          </div>

          <div className="px-6 py-4 border-t border-black/[0.05] flex items-center gap-3 shrink-0 bg-white">
            <motion.button
              type="submit"
              form="apply-form"
              disabled={!canSubmit}
              whileHover={
                canSubmit ? { scale: 1.02, boxShadow: "0 8px 20px rgba(37,99,235,0.25)" } : {}
              }
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              transition={{ duration: 0.18 }}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-xl transition-colors duration-200 ${
                canSubmit
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
              style={{ fontSize: "0.875rem" }}
            >
              {submitting ? (
                <>
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-white text-slate-500 font-semibold px-5 py-3 rounded-xl border border-slate-200 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
              style={{ fontSize: "0.875rem" }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
