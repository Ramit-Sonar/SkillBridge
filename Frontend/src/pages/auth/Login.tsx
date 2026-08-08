import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { loginUser } from "@/services/authService.js";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";
import { usePlatformSettings } from "@/app/data/platformSettingsStore";
import { BrandLogoMark } from "@/app/components/shared/BrandLogoMark";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handles student/client login and routes each role to its dashboard.
 */
export default function Login() {
  const navigate = useNavigate();
  const { platformName } = usePlatformSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const set = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setNotification(null);
      return;
    }

    setErrors({});
    setNotification(null);
    setLoading(true);

    try {
      const response = await loginUser({
        email: form.email,
        password: form.password,
        loginType: "common",
      });

      const user = response.data.user;

      // This login page is only for students and clients
      if (user.role === "admin") {
        setNotification({ type: "error", text: "Please use the Admin Login page." });
        return;
      }

      setNotification({ type: "success", text: "Login successful." });

      await wait(2000);

      if (user.role === "student") {
        navigate("/dashboard/student", { replace: true });
      } else if (user.role === "client") {
        navigate("/dashboard/client", { replace: true });
      } else {
        setNotification({ type: "error", text: "Invalid account type." });
      }
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Login failed. Please try again.",
      });
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
            <BrandLogoMark className="w-12 h-9" />
            <span className="font-bold text-slate-900" style={{ fontSize: "1.1rem" }}>
              Skill<span style={{ color: "#2563EB" }}>Bridge</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-black/[0.06] p-8 sm:p-10">
          <div className="mb-7">
            <h2 className="text-slate-900 tracking-tight font-bold" style={{ fontSize: "1.5rem" }}>
              Sign in to your {platformName} account
            </h2>
            <p className="text-slate-500 mt-1" style={{ fontSize: "0.875rem" }}>
              Good to have you back. Let's pick up where you left off.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${errors.email ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              {errors.email && (
                <p className="text-red-500" style={{ fontSize: "0.72rem" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => set("password")(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl pl-10 pr-11 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${errors.password ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}
                  style={{ fontSize: "0.875rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500" style={{ fontSize: "0.72rem" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  onClick={() => setRemember((v) => !v)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${remember ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300 group-hover:border-blue-600"}`}
                >
                  {remember && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-slate-600" style={{ fontSize: "0.82rem" }}>
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                style={{ fontSize: "0.82rem" }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3.5 rounded-xl mt-2 hover:bg-blue-700 transition-all duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
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
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400" style={{ fontSize: "0.72rem" }}>
              or
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Register link */}
          <p className="text-center text-slate-500" style={{ fontSize: "0.85rem" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-400 mt-6" style={{ fontSize: "0.72rem" }}>
          By signing in you agree to our{" "}
          <a
            href="#"
            className="text-slate-500 hover:text-slate-900 underline underline-offset-2 transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="text-slate-500 hover:text-slate-900 underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </motion.div>
  );
}
