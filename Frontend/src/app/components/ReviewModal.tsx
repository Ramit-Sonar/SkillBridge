import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, CheckCircle } from "lucide-react";
import { usePlatformSettings } from "../data/platformSettingsStore";
import { useModalScrollLock } from "./shared/useModalScrollLock";

interface ReviewModalProps {
  studentName: string;
  studentInitials: string;
  projectName: string;
  completedAt: string;
  onClose: () => void;
  onSubmit: (review: { rating: number; comment: string }) => Promise<void> | void;
}

export function ReviewModal({
  studentName,
  studentInitials,
  projectName,
  completedAt,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const { platformName } = usePlatformSettings();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useModalScrollLock();

  const canSubmit = rating > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setError("");
    setSubmitting(true);

    try {
      // Parent workspace owns review persistence and refreshes project state after success.
      await onSubmit({ rating, comment: comment.trim() });
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Review could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayStars = hovered || rating;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-5 p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <div>
                <p className="text-slate-900 font-bold" style={{ fontSize: "1.1rem" }}>
                  Review Submitted!
                </p>
                <p className="text-slate-500 mt-2 leading-relaxed" style={{ fontSize: "0.85rem" }}>
                  Thank you for sharing your feedback. Your review helps build trust on{" "}
                  {platformName}.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                style={{ fontSize: "0.875rem" }}
              >
                Done
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/[0.05]">
                <div>
                  <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                    Leave a Review
                  </p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
                    Share your experience with this student
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-5">
                {/* Student info card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold shrink-0"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {studentInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-slate-900 font-semibold truncate"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {studentName}
                    </p>
                    <p className="text-slate-500 truncate" style={{ fontSize: "0.72rem" }}>
                      {projectName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-slate-400" style={{ fontSize: "0.62rem" }}>
                      Completed
                    </p>
                    <p className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                      {completedAt}
                    </p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex flex-col items-center gap-3">
                  <p className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                    How would you rate this student?
                  </p>
                  <div className="flex gap-2" onMouseLeave={() => setHovered(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHovered(star)}
                        onClick={() => setRating(star)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="focus:outline-none"
                      >
                        <Star
                          className="w-9 h-9 transition-all duration-150"
                          style={{
                            fill: star <= displayStars ? "#F59E0B" : "transparent",
                            color: star <= displayStars ? "#F59E0B" : "#E2E8F0",
                          }}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {rating > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-semibold"
                        style={{ fontSize: "0.75rem", color: "#F59E0B" }}
                      >
                        {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Comment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                    Your Review
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience working with this student."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none"
                    style={{ fontSize: "0.82rem" }}
                  />
                </div>

                {error && (
                  <p
                    className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {error}
                  </p>
                )}

                {/* Submit */}
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  whileHover={
                    canSubmit ? { scale: 1.02, boxShadow: "0 8px 20px rgba(37,99,235,0.25)" } : {}
                  }
                  whileTap={canSubmit ? { scale: 0.97 } : {}}
                  className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all duration-200"
                  style={{
                    background: canSubmit ? "#2563EB" : "#F1F5F9",
                    color: canSubmit ? "white" : "#CBD5E1",
                    fontSize: "0.9rem",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
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
                    "Submit Review"
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
