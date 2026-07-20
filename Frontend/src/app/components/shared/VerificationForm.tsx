// Reusable verification form used in settings pages.
// Contains all form logic; wrapping (DashboardLayout, card chrome) is handled by the caller.

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Upload,
  X,
  FileText as FilePdf,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  submitStudentVerification,
  updateStudentVerification,
  type VerificationData,
} from "../../../services/verificationService";
import {
  getVerificationDisplayStatus,
  VERIFICATION_STATUS_CONFIG,
  type VerificationStatusValue,
} from "./VerificationStatusCard";
import type { NotificationMessage } from "./ui";

// Types 

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  preview: string | null;
}

// Helpers 

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

//File upload component 

interface FileUploadProps {
  label: string;
  hint: string;
  file: UploadedFile | null;
  onFile: (f: UploadedFile) => void;
  onRemove: () => void;
  required?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  label,
  hint,
  file,
  onFile,
  onRemove,
  required = true,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleRaw = useCallback(
    (raw: File) => {
      if (disabled) return;

      const isImage = raw.type.startsWith("image/");
      // Create previews only for images; PDFs are represented by metadata.
      onFile({
        file: raw,
        name: raw.name,
        size: raw.size,
        type: raw.type,
        preview: isImage ? URL.createObjectURL(raw) : null,
      });
    },
    [disabled, onFile]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleRaw(f);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
          {label}
        </label>
        {required && (
          <span className="text-red-400" style={{ fontSize: "0.75rem" }}>
            *
          </span>
        )}
      </div>
      <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>
        {hint}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return;

          const f = e.target.files?.[0];
          if (f) handleRaw(f);
          e.target.value = "";
        }}
      />
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onDragOver={(e) => {
              e.preventDefault();
              if (disabled) return;

              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (disabled) return;
              inputRef.current?.click();
            }}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all duration-200 ${
              dragging
                ? "border-blue-600 bg-blue-50 scale-[1.01]"
                : "border-slate-200 bg-slate-50 hover:border-blue-600/50 hover:bg-blue-50/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-200 ${dragging ? "bg-blue-200" : "bg-slate-200"}`}
            >
              <Upload
                className={`w-5 h-5 transition-colors duration-200 ${dragging ? "text-blue-600" : "text-slate-400"}`}
              />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.85rem" }}>
                Drag and drop your file here
              </p>
              <p className="text-slate-400 mt-1" style={{ fontSize: "0.75rem" }}>
                or
              </p>
              <button
                type="button"
                className="mt-1 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                style={{ fontSize: "0.82rem" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (disabled) return;
                  inputRef.current?.click();
                }}
              >
                Browse Files
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {["JPG", "PNG", "PDF"].map((ext) => (
                <span
                  key={ext}
                  className="bg-white border border-slate-200 text-slate-500 font-semibold px-2 py-0.5 rounded-md"
                  style={{ fontSize: "0.62rem" }}
                >
                  {ext}
                </span>
              ))}
              <span className="text-slate-300" style={{ fontSize: "0.62rem" }}>
                · Max 5 MB
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
          >
            {file.preview && (
              <div className="relative w-full bg-slate-100" style={{ maxHeight: 180 }}>
                <img
                  src={file.preview}
                  alt="Uploaded preview"
                  className="w-full object-cover"
                  style={{ maxHeight: 180 }}
                />
                <div
                  className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-600 font-bold px-2 py-1 rounded-lg"
                  style={{ fontSize: "0.6rem" }}
                >
                  <CheckCircle className="w-3 h-3" /> Uploaded
                </div>
              </div>
            )}
            {!file.preview && (
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <FilePdf className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-slate-900 font-semibold truncate"
                    style={{ fontSize: "0.82rem" }}
                  >
                    {file.name}
                  </p>
                  <p className="text-slate-400" style={{ fontSize: "0.7rem" }}>
                    PDF · {formatSize(file.size)}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-600 font-bold px-2 py-1 rounded-lg shrink-0"
                  style={{ fontSize: "0.6rem" }}
                >
                  <CheckCircle className="w-3 h-3" /> Ready
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.05]">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-slate-600 truncate font-medium" style={{ fontSize: "0.75rem" }}>
                  {file.name}
                </p>
                <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                  {formatSize(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    inputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  style={{ fontSize: "0.72rem" }}
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
                <div className="w-px h-3 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    onRemove();
                  }}
                  className="inline-flex items-center gap-1 text-red-400 font-semibold hover:text-red-500 transition-colors"
                  style={{ fontSize: "0.72rem" }}
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Success view is reused after create and update verification submissions.

export function VerificationSubmittedState({
  status = "pending",
  onBack,
}: {
  status?: VerificationStatusValue;
  onBack?: () => void;
}) {
  const displayStatus = getVerificationDisplayStatus(status);
  const statusConfig = VERIFICATION_STATUS_CONFIG[displayStatus];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center py-10 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 shadow-md">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-slate-900" style={{ fontSize: "1.1rem", fontWeight: 800 }}>
        Verification Submitted
      </h3>
      <p className="text-slate-500 mt-2 max-w-sm leading-relaxed" style={{ fontSize: "0.875rem" }}>
        Your verification request has been submitted. Our team will review your documents within 1–2
        business days.
      </p>
      <div className="mt-5 flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-amber-600 font-semibold" style={{ fontSize: "0.8rem" }}>
          Status: {statusConfig.label}
        </span>
      </div>
      {onBack && (
        <button
          onClick={onBack}
          className="mt-5 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          ← Back to Settings
        </button>
      )}
    </motion.div>
  );
}

// Main form keeps student and client KYC field handling in one place.

interface VerificationFormProps {
  /** Called after successful submission so parent can show a back button */
  onSubmitted?: (verification: VerificationData) => void;
  onNotify?: (message: NotificationMessage) => void;
  initialUniversity?: string;
  initialStudentId?: string;
  mode?: "submit" | "update";
  disabled?: boolean;
}

export function VerificationForm({
  onSubmitted,
  onNotify,
  initialUniversity = "",
  initialStudentId = "",
  mode = "submit",
  disabled = false,
}: VerificationFormProps) {
  const [university, setUniversity] = useState(initialUniversity);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [idCard, setIdCard] = useState<UploadedFile | null>(null);
  const [selfie, setSelfie] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<VerificationStatusValue>("pending");

  useEffect(() => {
    setUniversity(initialUniversity);
    setStudentId(initialStudentId);
  }, [initialStudentId, initialUniversity]);

  const canSubmit =
    !disabled &&
    university.trim() !== "" &&
    studentId.trim() !== "" &&
    idCard !== null &&
    selfie !== null;
  const canUpdate = !disabled && university.trim() !== "" && studentId.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "update") {
      if (!canUpdate || submitting) return;

      setSubmitting(true);

      const formData = new FormData();
      formData.append("university", university);
      formData.append("studentId", studentId);

      // Existing verification documents are reused unless the user uploads replacements.
      if (idCard) {
        formData.append("idCard", idCard.file);
      }

      if (selfie) {
        formData.append("selfie", selfie.file);
      }

      try {
        const response = await updateStudentVerification(formData);
        const status = response.data.status;

        setSubmittedStatus(status);
        setSubmitted(true);
        onSubmitted?.(response.data);
        onNotify?.({
          type: "success",
          text: "Verification updated successfully. Your verification has been resubmitted for review.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Verification request could not be updated.";
        onNotify?.({ type: "error", text: message });
      } finally {
        setSubmitting(false);
      }

      return;
    }

    if (!canSubmit || submitting || !idCard || !selfie) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append("university", university);
    formData.append("studentId", studentId);
    formData.append("idCard", idCard.file);
    formData.append("selfie", selfie.file);

    try {
      const response = await submitStudentVerification(formData);
      const status = response.data.status;

      setSubmittedStatus(status);
      setSubmitted(true);
      onSubmitted?.(response.data);
      onNotify?.({
        type: "success",
        text: "Verification submitted successfully. Your documents have been submitted for review.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification request could not be submitted.";
      onNotify?.({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VerificationSubmittedState status={submittedStatus} />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* College name */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                  College Name
                </label>
                <span className="text-red-400" style={{ fontSize: "0.75rem" }}>
                  *
                </span>
              </div>
              <input
                type="text"
                placeholder="Enter your college name"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                disabled={disabled || submitting}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                style={{ fontSize: "0.875rem" }}
              />
            </div>

            {/* Student ID */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                  Student ID
                </label>
                <span className="text-red-400" style={{ fontSize: "0.75rem" }}>
                  *
                </span>
              </div>
              <input
                type="text"
                placeholder="Enter your student ID number"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={disabled || submitting}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                style={{ fontSize: "0.875rem" }}
              />
            </div>

            <div className="border-t border-black/[0.05]" />

            <FileUpload
              label="College ID Card"
              hint="Upload a clear photo or scan of your official student ID card."
              file={idCard}
              onFile={setIdCard}
              onRemove={() => setIdCard(null)}
              disabled={disabled || submitting}
            />

            <FileUpload
              label="Student Selfie"
              hint="Take a selfie clearly showing your face alongside your student ID card."
              file={selfie}
              onFile={setSelfie}
              onRemove={() => setSelfie(null)}
              disabled={disabled || submitting}
            />

            {mode === "submit" && !canSubmit && (university || studentId || idCard || selfie) && (
              <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                  Please fill in all required fields and upload both documents before submitting.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={mode === "update" ? !canUpdate || submitting : !canSubmit || submitting}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all ${
                ((mode === "update" ? canUpdate : canSubmit) && !submitting)
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
              style={{ fontSize: "0.9rem" }}
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
                  <ShieldCheck className="w-4 h-4" />
                  {mode === "update" ? "Update Verification" : "Submit Verification"}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
