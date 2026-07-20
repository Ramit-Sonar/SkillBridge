import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, KeyRound, Mail, Zap } from "lucide-react";

import { verifyEmail } from "@/services/authService";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Completes registration by verifying the OTP sent from the register page.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Register passes the email through route state so users cannot edit it here.
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email is missing. Please register again.");
      return;
    }

    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setError("");
    setNotification(null);
    setLoading(true);

    try {
      await verifyEmail(email, otp.trim());
      setNotification({ type: "success", text: "Registration successful." });
      await wait(1500);
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OTP verification failed.";
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
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-slate-900" style={{ fontSize: "1.1rem" }}>
              Skill<span style={{ color: "#2563EB" }}>Bridge</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-black/[0.06] p-8 sm:p-10">
          <div className="mb-7">
            <h2 className="text-slate-900 tracking-tight font-bold" style={{ fontSize: "1.5rem" }}>
              Verify Email
            </h2>
            <p className="text-slate-500 mt-1 leading-relaxed" style={{ fontSize: "0.875rem" }}>
              Enter the 6-digit code sent to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-500 outline-none"
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                OTP
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
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
                  Verify Email <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-slate-500 font-semibold hover:text-slate-900 transition-colors"
              style={{ fontSize: "0.875rem" }}
            >
              Back to Register
            </button>
          </form>
        </div>
      </div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </motion.div>
  );
}
