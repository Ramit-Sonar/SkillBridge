import { useState } from "react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { getCurrentUser, loginUser } from "@/services/authService.js";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";
import { usePlatformSettings } from "@/app/data/platformSettingsStore";
import { BrandLogoMark } from "@/app/components/shared/BrandLogoMark";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handles the admin-only login surface separately from student/client login.
 */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { platformName } = usePlatformSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await getCurrentUser();

        // Existing admin sessions should enter the admin dashboard directly.
        if (response.data.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch {
        // Visitors, students, and clients can still open the admin login page.
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setNotification(null);
    setLoading(true);

    try {
      const response = await loginUser({
        email,
        password,
        loginType: "admin",
      });

      const user = response.data.user;

      if (user.role !== "admin") {
        setNotification({ type: "error", text: "Only administrators can log in here." });
        return;
      }

      setNotification({ type: "success", text: "Login successful." });
      await wait(2000);
      navigate("/admin/dashboard", {
        replace: true,
      });
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <BrandLogoMark className="w-20 h-14 rounded-2xl shadow-lg" />
          <div className="text-center">
            <p className="text-slate-900 font-bold" style={{ fontSize: "1.1rem" }}>
              Skill<span className="text-blue-600">Bridge</span>
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 bg-amber-100 text-amber-600 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              <span style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}>ADMIN ACCESS</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xl p-7 flex flex-col gap-5">
          <div>
            <h1 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
              Admin Sign In
            </h1>
            <p className="text-slate-500 mt-1" style={{ fontSize: "0.78rem" }}>
              Access the {platformName} admin panel
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.8rem" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  style={{ fontSize: "0.875rem" }}
                  placeholder="admin@skillbridge.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 font-semibold" style={{ fontSize: "0.8rem" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  style={{ fontSize: "0.875rem" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={
                !loading ? { scale: 1.02, boxShadow: "0 8px 24px rgba(15,23,42,0.25)" } : {}
              }
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-slate-800 disabled:opacity-70"
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
                  <ShieldCheck className="w-4 h-4" /> Sign In to Admin
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-slate-400" style={{ fontSize: "0.72rem" }}>
            Use the admin credentials configured in the backend
          </p>
        </div>

        <p className="text-center text-slate-300 mt-6" style={{ fontSize: "0.68rem" }}>
          Not an admin?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Go to {platformName}
          </button>
        </p>
      </motion.div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
