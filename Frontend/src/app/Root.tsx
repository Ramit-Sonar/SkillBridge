import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { getCurrentUser } from "../services/authService";

/**
 * Root route wrapper for nested public and dashboard pages.
 */
export default function Root() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") return;
    if (location.pathname === "/maintenance") return;
    if (location.pathname.startsWith("/dashboard")) return;

    getCurrentUser().catch(() => {
      // Public pages only use this to detect maintenance mode.
    });
  }, [location.pathname]);

  return <Outlet />;
}
