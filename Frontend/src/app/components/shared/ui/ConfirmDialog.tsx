import { useRef, useState, type ElementType, type ReactNode } from "react";
import { motion } from "motion/react";
import { useModalScrollLock } from "../useModalScrollLock";

type ConfirmDialogProps = {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
  icon?: ElementType;
  iconBg?: string;
  iconColor?: string;
  align?: "left" | "center";
  maxWidthClassName?: string;
  busyDelayMs?: number;
};

/**
 * Shared confirmation dialog for destructive or status-changing actions.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  confirmColor,
  onConfirm,
  onClose,
  loading,
  icon: Icon,
  iconBg = "#F8FAFC",
  iconColor = "#64748B",
  align = "left",
  maxWidthClassName = "max-w-sm",
  busyDelayMs = 900,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const confirmLockedRef = useRef(false);
  const centered = align === "center";
  const isBusy = busy || Boolean(loading);

  useModalScrollLock();

  const handleConfirm = async () => {
    if (isBusy || confirmLockedRef.current) return;

    confirmLockedRef.current = true;
    setBusy(true);

    try {
      if (busyDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, busyDelayMs));
      }

      await onConfirm();
    } catch {
      // Page-level action handlers show the backend error message.
    } finally {
      confirmLockedRef.current = false;
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
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClassName} p-6 flex flex-col gap-5 ${
          centered ? "items-center text-center" : ""
        }`}
      >
        {Icon && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: iconBg }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>
        )}
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
            {title}
          </p>
          <div className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
            {body}
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:text-slate-900 transition-all disabled:opacity-60"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <motion.button
            whileHover={!isBusy ? { scale: 1.02 } : {}}
            whileTap={!isBusy ? { scale: 0.97 } : {}}
            onClick={handleConfirm}
            disabled={isBusy}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: confirmColor, fontSize: "0.875rem" }}
          >
            {isBusy ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              confirmLabel
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
