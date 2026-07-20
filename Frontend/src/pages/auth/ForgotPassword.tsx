import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPassword } from "@/services/authService";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";

/**
 * Requests a password reset email for an existing account.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setNotification(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
      setNotification({ type: "success", text: "Password reset link sent to your email." });
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
        {/* Logo */}
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
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-5"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-bold" style={{ fontSize: "1.25rem" }}>
                    Check your email
                  </h2>
                  <p
                    className="text-slate-500 mt-2 leading-relaxed"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Password reset instructions have been sent to{" "}
                    <span className="font-semibold text-slate-900">{email}</span>.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  style={{ fontSize: "0.875rem" }}
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-7">
                  <h2
                    className="text-slate-900 tracking-tight font-bold"
                    style={{ fontSize: "1.5rem" }}
                  >
                    Forgot Password
                  </h2>
                  <p
                    className="text-slate-500 mt-1 leading-relaxed"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Enter your email address and we will send password reset instructions.
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="you@email.com"
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
                      "Send Reset Link"
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-1.5 text-slate-500 font-semibold hover:text-slate-900 transition-colors"
                    style={{ fontSize: "0.875rem" }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </motion.div>
  );
}
