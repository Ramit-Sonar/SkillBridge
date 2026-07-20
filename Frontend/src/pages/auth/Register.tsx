import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Zap, User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { sendVerificationOtp } from "@/services/authService";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";

// Input field component

interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
}

function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  suffix,
  error,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${error ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"}`}
          style={{ fontSize: "0.875rem", paddingRight: suffix ? "2.75rem" : "1rem" }}
        />
        {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && (
        <p className="text-red-500" style={{ fontSize: "0.72rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Starts registration by requesting an email OTP before creating the account.
 */
export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "client">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const set = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.includes("@")) e.email = "Enter a valid email address.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
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
      // The backend stores this as a pending registration until OTP verification.
      await sendVerificationOtp({
        fullName: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirm,
        role,
      });

      setNotification({ type: "success", text: "OTP sent successfully." });
      navigate("/verify-email", {
        state: { email: form.email.trim().toLowerCase() },
      });
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Registration failed. Please try again.",
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-slate-900" style={{ fontSize: "1.1rem" }}>
              Skill<span style={{ color: "#2563EB" }}>Bridge</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-black/[0.06] p-8 sm:p-10">
          <div className="mb-7">
            <h2 className="text-slate-900 tracking-tight font-bold" style={{ fontSize: "1.5rem" }}>
              Create your account
            </h2>
            <p className="text-slate-500 mt-1" style={{ fontSize: "0.875rem" }}>
              Join SkillBridge and start building your career.
            </p>
          </div>

          {/* Role selector */}
          <div className="relative flex bg-slate-100 rounded-2xl p-1 mb-6">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm"
              animate={{ x: role === "student" ? 4 : "calc(100% + 4px)" }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            />
            {(["student", "client"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="relative z-10 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
                style={{ color: role === r ? "#0F172A" : "#94A3B8" }}
              >
                {r === "student" ? "I am a Student" : "I am a Client"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={role}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="text-slate-500 mb-5 text-center"
              style={{ fontSize: "0.78rem" }}
            >
              {role === "student"
                ? "Sign up to find projects, build your portfolio, and earn."
                : "Sign up to post projects and hire verified student talent."}
            </motion.p>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              label="Full Name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={set("name")}
              icon={<User className="w-4 h-4" />}
              error={errors.name}
            />
            <InputField
              label="Email Address"
              type="email"
              placeholder={role === "student" ? "you@university.edu.np" : "you@gmail.com"}
              value={form.email}
              onChange={set("email")}
              icon={<Mail className="w-4 h-4" />}
              error={errors.email}
            />
            <InputField
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set("password")}
              icon={<Lock className="w-4 h-4" />}
              error={errors.password}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <InputField
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={set("confirm")}
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirm}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-slate-400 hover:text-slate-500 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

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
                  Create Account <ArrowRight className="w-4 h-4" />
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

          <p className="text-center text-slate-500" style={{ fontSize: "0.85rem" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-400 mt-6" style={{ fontSize: "0.72rem" }}>
          By creating an account you agree to our{" "}
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
