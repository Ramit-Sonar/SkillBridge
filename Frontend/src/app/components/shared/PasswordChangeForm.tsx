import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/services/authService";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10";

type PasswordFieldName = "current" | "new" | "confirm";

type TouchedFields = Record<PasswordFieldName, boolean>;

const initialTouched: TouchedFields = {
  current: false,
  new: false,
  confirm: false,
};

const placeholders: Record<PasswordFieldName, string> = {
  current: "Enter your current password",
  new: "Enter your new password",
  confirm: "Re-enter your new password",
};

const labels: Record<PasswordFieldName, string> = {
  current: "Current Password",
  new: "New Password",
  confirm: "Confirm Password",
};

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1">
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

function ErrorMsg({ msg }: { msg: string }) {
  return msg ? (
    <p className="text-red-500 font-medium" style={{ fontSize: "0.72rem" }}>
      {msg}
    </p>
  ) : null;
}

function getFieldError(field: PasswordFieldName, value: string, newPassword: string) {
  if (!value.trim()) {
    return `${labels[field]} is required.`;
  }

  if (field === "confirm" && value !== newPassword) {
    return "Passwords do not match.";
  }

  return "";
}

export function PasswordChangeForm() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>(initialTouched);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const errors = {
    current: getFieldError("current", current, newPw),
    new: getFieldError("new", newPw, newPw),
    confirm: getFieldError("confirm", confirm, newPw),
  };

  const canSavePw = !errors.current && !errors.new && !errors.confirm;

  const markTouched = (field: PasswordFieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSavePw = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ current: true, new: true, confirm: true });
    setNotification(null);

    if (!current.trim() || !newPw.trim() || !confirm.trim()) {
      setNotification({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    if (newPw !== confirm) {
      setNotification({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setSaving(true);
      // Password changes stay in the auth service so settings UI does not handle API details.
      await changePassword({
        oldPassword: current,
        newPassword: newPw,
      });

      setSaving(false);
      setSaved(true);
      setCurrent("");
      setNewPw("");
      setConfirm("");
      setTouched(initialTouched);
      setNotification({ type: "success", text: "Password changed successfully." });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaving(false);
      const message = error instanceof Error ? error.message : "";
      const text =
        message === "Invalid old password"
          ? "Current password is incorrect."
          : "Failed to change password. Please try again.";

      setNotification({ type: "error", text });
    }
  };

  const pwField = (
    field: PasswordFieldName,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggle: () => void
  ) => {
    const error =
      touched[field] && errors[field] !== "Passwords do not match." ? errors[field] : "";

    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel text={labels[field]} required />
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => markTouched(field)}
            placeholder={placeholders[field]}
            className={`${inputCls} pr-10`}
            style={{ fontSize: "0.875rem" }}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={show ? `Hide ${labels[field]}` : `Show ${labels[field]}`}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <ErrorMsg msg={error} />
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSavePw} className="flex flex-col gap-4">
        <p className="text-slate-900 font-semibold" style={{ fontSize: "0.875rem" }}>
          Change Password
        </p>
        {pwField("current", current, setCurrent, showCur, () => setShowCur((v) => !v))}
        {pwField("new", newPw, setNewPw, showNew, () => setShowNew((v) => !v))}
        {pwField("confirm", confirm, setConfirm, showCon, () => setShowCon((v) => !v))}
        {touched.confirm && errors.confirm === "Passwords do not match." && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span style={{ fontSize: "0.75rem" }}>Passwords do not match.</span>
          </div>
        )}
        <div className="pt-1 border-t border-black/[0.05]">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={!saving ? { scale: 1.02 } : {}}
            whileTap={!saving ? { scale: 0.97 } : {}}
            className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-100"
            style={{
              background: saved ? "#059669" : canSavePw ? "#2563EB" : "#E2E8F0",
              border: canSavePw ? "1px solid transparent" : "1px solid #CBD5E1",
              color: canSavePw ? "white" : "#64748B",
              fontSize: "0.875rem",
              cursor: !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : saved ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              "Change Password"
            )}
          </motion.button>
        </div>
      </form>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </>
  );
}
