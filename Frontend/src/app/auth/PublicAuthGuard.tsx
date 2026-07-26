import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";

import { Notification, type NotificationMessage } from "@/app/components/shared/ui";
import { getCurrentUser, logoutUser, type AuthUser } from "@/services/authService";
import { isMaintenanceModeError } from "@/services/apiConfig";

type PublicAuthGuardProps = {
  page: "login" | "register";
  children: React.ReactNode;
};

const dashboardPaths = {
  student: "/dashboard/student",
  client: "/dashboard/client",
  admin: "/admin/dashboard",
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Keeps logged-in users from accidentally using public login/register screens.
 */
export default function PublicAuthGuard({ page, children }: PublicAuthGuardProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  useEffect(() => {
    let waitingForMaintenanceRedirect = false;

    const checkUser = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response.data);

        // Only students and clients see this public login/register dialog.
        if (response.data.role === "student" || response.data.role === "client") {
          setDialogOpen(true);
        }
      } catch (error) {
        if (isMaintenanceModeError(error)) {
          waitingForMaintenanceRedirect = true;
          return;
        }

        setUser(null);
      } finally {
        if (waitingForMaintenanceRedirect) return;
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const continueToDashboard = () => {
    if (!user) return;
    navigate(dashboardPaths[user.role], { replace: true });
  };

  const switchAccount = async () => {
    setNotification(null);
    setLogoutLoading(true);

    try {
      await logoutUser();
      setUser(null);
      setDialogOpen(false);
      setNotification({ type: "success", text: "Logout successful." });
      await wait(1000);
      navigate(page === "login" ? "/login" : "/register", { replace: true });
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Logout failed. Please try again.",
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  const roleName = user?.role === "student" ? "Student" : "Client";
  const message =
    page === "login"
      ? `You are already signed in as a ${roleName}.\nWould you like to continue or switch to another account?`
      : `You are already signed in as a ${roleName}.\nTo create another account, you must first sign out.`;
  const secondaryButtonText = page === "login" ? "Switch Account" : "Logout & Create New Account";

  return (
    <>
      {children}

      <AnimatePresence>
        {dialogOpen && user && user.role !== "admin" && (
          <motion.div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/[0.06]"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-slate-900 font-bold" style={{ fontSize: "1.2rem" }}>
                Already signed in
              </h2>
              <p
                className="text-slate-500 mt-3 whitespace-pre-line leading-relaxed"
                style={{ fontSize: "0.9rem" }}
              >
                {message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={continueToDashboard}
                  className="flex-1 bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm active:scale-95"
                  style={{ fontSize: "0.875rem" }}
                >
                  Continue to Dashboard
                </button>
                <button
                  type="button"
                  onClick={switchAccount}
                  disabled={logoutLoading}
                  className="flex-1 bg-slate-100 text-slate-900 font-semibold px-5 py-3 rounded-xl hover:bg-slate-200 transition-all duration-200 disabled:opacity-70"
                  style={{ fontSize: "0.875rem" }}
                >
                  {logoutLoading ? "Logging out..." : secondaryButtonText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Notification message={notification} onClose={() => setNotification(null)} />
    </>
  );
}
