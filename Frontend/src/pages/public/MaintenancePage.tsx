import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";
import { logoutUser, type AuthUser } from "../../services/authService";
import {
  getApiBaseUrl,
  getStoredMaintenanceState,
  isMaintenanceResponseData,
  saveMaintenanceState,
} from "../../services/apiConfig";
import {
  setPlatformSettings,
  usePlatformSettings,
} from "../../app/data/platformSettingsStore";

const dashboardPaths: Record<AuthUser["role"], string> = {
  student: "/dashboard/student",
  client: "/dashboard/client",
  admin: "/admin/dashboard",
};

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { platformName, supportEmail } = usePlatformSettings();
  const stored = getStoredMaintenanceState();
  const defaultMessage = `${platformName} is currently under maintenance.`;
  const [message, setMessage] = useState(stored?.maintenanceMessage || defaultMessage);
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const checkAvailability = async () => {
    setChecking(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/current-user`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (response.status === 503 && isMaintenanceResponseData(data)) {
        saveMaintenanceState(data);
        setMessage(data.maintenanceMessage || data.message || defaultMessage);
        setAuthenticated(Boolean(data.authenticated));
        setPlatformSettings({
          platformName: data.platformName,
          supportEmail: data.supportEmail,
          platformDescription: data.platformDescription,
          maintenanceMessage: data.maintenanceMessage || data.message,
        });
        return;
      }

      if (response.ok) {
        const user = data.data as AuthUser;
        navigate(searchParams.get("returnTo") || dashboardPaths[user.role] || "/", {
          replace: true,
        });
        return;
      }

      setAuthenticated(false);
      navigate("/", { replace: true });
    } catch {
      setMessage(defaultMessage);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (stored) {
      setPlatformSettings({
        platformName: stored.platformName,
        supportEmail: stored.supportEmail,
        platformDescription: stored.platformDescription,
        maintenanceMessage: stored.maintenanceMessage,
      });
    }

    checkAvailability();
    // The first check should run once when the maintenance page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logoutUser();
    } catch {
      // The logout button should still move the user away from a stale session.
    } finally {
      setAuthenticated(false);
      setLoggingOut(false);
      navigate("/maintenance", { replace: true });
    }
  };

  return (
    <main
      className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg bg-white border border-black/[0.06] rounded-2xl shadow-xl p-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-slate-900 font-bold mt-5" style={{ fontSize: "1.3rem" }}>
          {platformName} Maintenance
        </h1>
        <p className="text-slate-500 leading-relaxed mt-2" style={{ fontSize: "0.9rem" }}>
          {message}
        </p>
        {supportEmail && (
          <p className="text-slate-400 mt-3" style={{ fontSize: "0.78rem" }}>
            Need help? Contact {supportEmail}.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={checkAvailability}
            disabled={checking}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70"
            style={{ fontSize: "0.875rem" }}
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking..." : "Refresh"}
          </button>
          {authenticated && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold px-5 py-3 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-70"
              style={{ fontSize: "0.875rem" }}
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          )}
        </div>
      </motion.section>
    </main>
  );
}
