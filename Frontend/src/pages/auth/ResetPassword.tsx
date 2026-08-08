import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Lock } from "lucide-react";

import { resetPassword } from "@/services/authService";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";
import { BrandLogoMark } from "@/app/components/shared/BrandLogoMark";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Consumes a password reset token from the route and sets a new password.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setNotification(null);
    setLoading(true);

    try {
      await resetPassword(token, password, confirmPassword);
      setNotification({ type: "success", text: "Password reset successfully." });
      await wait(1500);
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password reset failed.";
      setError(message);
      setNotification({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <BrandLogoMark className="w-14 h-10" />
            <span className="font-bold text-slate-900" style={{ fontSize: "1.25rem" }}>
              Skill<span style={{ color: "#2563EB" }}>Bridge</span>
            </span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-black/[0.06] p-8 sm:p-10">
          <div className="mb-7">
            <h2 className="text-slate-900 tracking-tight font-bold" style={{ fontSize: "1.5rem" }}>
              Reset Password
            </h2>
            <p className="text-slate-500 mt-1 leading-relaxed" style={{ fontSize: "0.875rem" }}>
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter new password"
                  className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${error ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${error ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              {error && (
                <p className="text-red-500" style={{ fontSize: "0.72rem" }}>
                  {error}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-70"
              style={{ fontSize: "0.9rem" }}
            >
              {loading ? (
                <motion.span
                  className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  Reset Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </motion.div>
  );
}
