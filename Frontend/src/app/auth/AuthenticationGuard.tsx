import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";

import { getCurrentUser, type AuthUser } from "@/services/authService";
import { isMaintenanceModeError } from "@/services/apiConfig";

type AuthenticationGuardProps = {
  allowedRole: AuthUser["role"];
  children: React.ReactNode;
};

const dashboardPaths = {
  student: "/dashboard/student",
  client: "/dashboard/client",
  admin: "/admin/dashboard",
};

/**
 * Protects dashboard routes and redirects authenticated users to their own role area.
 */
export default function AuthenticationGuard({ allowedRole, children }: AuthenticationGuardProps) {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let waitingForMaintenanceRedirect = false;

    const checkUser = async () => {
      try {
        // This checks the existing login cookie after page refresh.
        const response = await getCurrentUser();
        setUser(response.data);
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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    // Admin pages use the admin login page. Students and clients use the common login page.
    const loginPath = allowedRole === "admin" ? "/admin/login" : "/login";
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (user.role !== allowedRole) {
    // Logged-in users can only open their own dashboard area.
    return <Navigate to={dashboardPaths[user.role]} replace />;
  }

  return children;
}
