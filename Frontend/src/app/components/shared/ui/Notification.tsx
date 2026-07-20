import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export type NotificationMessage = {
  type: "success" | "error";
  text: string;
} | null;

type NotificationProps = {
  message: NotificationMessage;
  onClose: () => void;
  duration?: number;
};

export function Notification({ message, onClose, duration = 2000 }: NotificationProps) {
  useEffect(() => {
    if (!message) return;

    // Auto-dismiss transient feedback while allowing callers to clear it early.
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, message, onClose]);

  const isSuccess = message?.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            aria-live="polite"
            className={`w-full max-w-sm rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
              isSuccess
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="font-medium leading-snug" style={{ fontSize: "0.86rem" }}>
                {message.text}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
