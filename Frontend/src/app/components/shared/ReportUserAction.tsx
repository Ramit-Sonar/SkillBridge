import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Flag, X } from "lucide-react";
import { Notification, type NotificationMessage } from "./ui";
import {
  submitReport,
  type ReportReason,
  type SubmitReportPayload,
} from "../../../services/reportService";

const REPORT_REASONS = [
  "Scam / Fraud",
  "Fake Profile",
  "Harassment",
  "Spam",
  "Inappropriate Behavior",
  "Other",
] as const;

type ReportUserActionProps = {
  reportedUserId?: string;
  reportedUserName: string;
  reportedUserRole: "student" | "client" | "user";
  className?: string;
  buttonLabel?: string;
};

function ReportUserModal({
  reportedUserId,
  reportedUserName,
  reportedUserRole,
  onClose,
  onSubmitted,
}: {
  reportedUserId?: string;
  reportedUserName: string;
  reportedUserRole: SubmitReportPayload["reportedUserRole"];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogId = useId();
  const reasonId = `${dialogId}-reason`;
  const descriptionId = `${dialogId}-description`;
  const canSubmit = !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (!reason) {
      setError("Please select a report reason.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await submitReport({
        reportedUserId,
        reportedUserName,
        reportedUserRole,
        reason,
        description: description.trim(),
      });
      onSubmitted();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Report could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0 border-b border-black/[0.05]">
          <div>
            <h3
              id={`${dialogId}-title`}
              className="text-slate-900 font-bold"
              style={{ fontSize: "1rem" }}
            >
              Report User
            </h3>
            <p className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
              Tell the SkillBridge team what happened with {reportedUserName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close report user modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={reasonId}
              className="text-slate-900 font-semibold"
              style={{ fontSize: "0.82rem" }}
            >
              Reason <span className="text-red-400">*</span>
            </label>
            <select
              id={reasonId}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value as ReportReason | "");
                setError("");
              }}
              disabled={busy}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:opacity-60"
              style={{ fontSize: "0.875rem" }}
            >
              <option value="">Select reason</option>
              {REPORT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={descriptionId}
                className="text-slate-900 font-semibold"
                style={{ fontSize: "0.82rem" }}
              >
                Description <span className="text-red-400">*</span>
              </label>
              <span className="text-slate-400 font-semibold" style={{ fontSize: "0.68rem" }}>
                {description.length}/500
              </span>
            </div>
            <textarea
              id={descriptionId}
              rows={5}
              maxLength={500}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError("");
              }}
              disabled={busy}
              placeholder={`Describe the issue with this ${reportedUserRole}.`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none disabled:opacity-60"
              style={{ fontSize: "0.875rem" }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-500 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 shrink-0 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:text-slate-900 transition-all disabled:opacity-60"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <motion.button
            type="button"
            whileHover={!busy ? { scale: 1.02 } : {}}
            whileTap={!busy ? { scale: 0.97 } : {}}
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            style={{ fontSize: "0.875rem" }}
          >
            {busy ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              "Submit Report"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ReportUserAction({
  reportedUserId,
  reportedUserName,
  reportedUserRole,
  className = "w-full flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors",
  buttonLabel = "Report User",
}: ReportUserActionProps) {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const handleSubmitted = () => {
    setOpen(false);
    setNotification({
      type: "success",
      text: "Report submitted successfully for admin review.",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={{ fontSize: "0.82rem" }}
      >
        <Flag className="w-4 h-4" /> {buttonLabel}
      </button>

      <AnimatePresence>
        {open && (
          <ReportUserModal
            reportedUserId={reportedUserId}
            reportedUserName={reportedUserName}
            reportedUserRole={reportedUserRole}
            onClose={() => setOpen(false)}
            onSubmitted={handleSubmitted}
          />
        )}
      </AnimatePresence>

      <Notification message={notification} onClose={() => setNotification(null)} />
    </>
  );
}
