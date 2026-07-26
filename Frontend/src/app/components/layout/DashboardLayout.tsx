import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  ChevronDown,
  FileText,
  Flag,
  Folder,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Settings,
  ShieldAlert,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getCurrentUser, logoutUser, type AuthUser } from "@/services/authService";
import { Notification, type NotificationMessage } from "@/app/components/shared/ui";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const ACCOUNT_SUSPENDED_MESSAGE =
  "Your account has been suspended. Some marketplace features have been disabled.";

export type DashboardRole = "student" | "client" | "admin";
export type DashboardCurrentUser = AuthUser & {
  avatar?: string;
  username?: string;
  phone?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
};

const DashboardCurrentUserContext = createContext<DashboardCurrentUser | null>(null);

/**
 * Exposes the authenticated dashboard user to nested profile and verification views.
 */
export function useDashboardCurrentUser() {
  return useContext(DashboardCurrentUserContext);
}

function loadDashboardCurrentUser() {
  return getCurrentUser()
    .then((response) => response.data)
    .catch(() => null);
}

function formatRole(role: DashboardRole) {
  if (role === "student") return "Student";
  if (role === "client") return "Client";
  return "Admin";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isAccountSuspended(user: Pick<DashboardCurrentUser, "accountStatus"> | null) {
  return user?.accountStatus === "suspended";
}

type DashboardNavId =
  | "dashboard"
  | "profile"
  | "post-job"
  | "browse-jobs"
  | "manage-jobs"
  | "applications"
  | "projects"
  | "users"
  | "jobs"
  | "reports"
  | "students"
  | "settings"
  | "logout";

interface NavItem {
  id: DashboardNavId;
  label: string;
  icon: ElementType;
  badge?: string;
  danger?: boolean;
}

interface DropdownAction {
  id: string;
  label: string;
  icon: ElementType;
  path: string;
  danger?: boolean;
}

interface RoleConfig {
  mainNav: NavItem[];
  bottomNav: NavItem[];
  paths: Partial<Record<DashboardNavId, string>>;
  user: {
    avatarClassName: string;
    labelColor: string;
  };
  dropdownActions: DropdownAction[];
  logoutPath: string;
}

interface DashboardLayoutProps {
  role: DashboardRole;
  title: string;
  activeNav?: string;
  children: ReactNode;
}

const roleConfig: Record<DashboardRole, RoleConfig> = {
  student: {
    mainNav: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User },
      { id: "browse-jobs", label: "Browse Jobs", icon: Search },
      { id: "applications", label: "My Applications", icon: FileText },
      { id: "projects", label: "Projects", icon: Folder },
    ],
    bottomNav: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "logout", label: "Logout", icon: LogOut, danger: true },
    ],
    paths: {
      dashboard: "/dashboard/student",
      profile: "/dashboard/student/profile",
      "browse-jobs": "/dashboard/student/browse-jobs",
      applications: "/dashboard/student/applications",
      projects: "/dashboard/student/projects",
      settings: "/dashboard/student/settings",
      logout: "/",
    },
    user: {
      avatarClassName: "bg-gradient-to-br from-blue-600 to-teal-500",
      labelColor: "#2563EB",
    },
    dropdownActions: [
      {
        id: "profile",
        label: "My Profile",
        icon: User,
        path: "/dashboard/student/profile",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/dashboard/student/settings",
      },
    ],
    logoutPath: "/",
  },
  client: {
    mainNav: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "post-job", label: "Post Job", icon: PlusCircle },
      { id: "manage-jobs", label: "Manage Jobs", icon: Briefcase },
      { id: "projects", label: "Projects", icon: Folder },
    ],
    bottomNav: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "logout", label: "Logout", icon: LogOut, danger: true },
    ],
    paths: {
      dashboard: "/dashboard/client",
      "post-job": "/dashboard/client/post-job",
      "manage-jobs": "/dashboard/client/manage-jobs",
      projects: "/dashboard/client/projects",
      settings: "/dashboard/client/settings",
      logout: "/",
    },
    user: {
      avatarClassName: "bg-gradient-to-br from-blue-600 to-teal-500",
      labelColor: "#14B8A6",
    },
    dropdownActions: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/dashboard/client/settings",
      },
    ],
    logoutPath: "/",
  },
  admin: {
    mainNav: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "users", label: "Users", icon: Users },
      { id: "jobs", label: "Jobs", icon: Briefcase },
      { id: "reports", label: "Reports", icon: Flag },
      {
        id: "students",
        label: "Verification Management",
        icon: GraduationCap,
        badge: "PENDING",
      },
      { id: "settings", label: "Platform Settings", icon: Settings },
    ],
    bottomNav: [{ id: "logout", label: "Logout", icon: LogOut, danger: true }],
    paths: {
      dashboard: "/admin/dashboard",
      students: "/admin/students",
      users: "/admin/users",
      jobs: "/admin/jobs",
      reports: "/admin/reports",
      settings: "/admin/settings",
      logout: "/admin/login",
    },
    user: {
      avatarClassName: "bg-gradient-to-br from-amber-600 to-amber-500",
      labelColor: "#D97706",
    },
    dropdownActions: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/admin/settings",
      },
    ],
    logoutPath: "/admin/login",
  },
};

function getDashboardPath(role: DashboardRole, id: DashboardNavId) {
  return roleConfig[role].paths[id];
}

function Sidebar({
  role,
  currentUser,
  activeItem,
  onItemClick,
  onLogout,
}: {
  role: DashboardRole;
  currentUser: DashboardCurrentUser | null;
  activeItem: DashboardNavId;
  onItemClick: (id: DashboardNavId) => void;
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandTimer = useRef<ReturnType<typeof setTimeout>>();
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const config = roleConfig[role];
  const displayName = currentUser?.fullName ?? "";
  const displayRole = currentUser?.role ? formatRole(currentUser.role) : "";
  const displayInitials = displayName ? getInitials(displayName) : "";
  const displayAvatar = currentUser?.avatar;

  const handleMouseEnter = () => {
    clearTimeout(collapseTimer.current);
    expandTimer.current = setTimeout(() => setExpanded(true), 130);
  };

  const handleMouseLeave = () => {
    clearTimeout(expandTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 180);
  };

  const handleNav = (id: DashboardNavId) => {
    if (id === "logout") {
      onLogout();
      return;
    }

    onItemClick(id);
    const path = getDashboardPath(role, id);
    if (path) navigate(path);
  };

  const renderTooltip = (label: string, animated = true) => (
    <div
      className={`absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-[200] opacity-0 group-hover/nav:opacity-100 pointer-events-none ${
        animated
          ? "transition-all duration-200 ease-out -translate-x-1 group-hover/nav:translate-x-0"
          : "transition-opacity duration-150"
      }`}
    >
      <div
        className="relative bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap"
        style={{ fontSize: "0.75rem" }}
      >
        {label}
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-0 h-0"
          style={{
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: "5px solid #0F172A",
          }}
        />
      </div>
    </div>
  );

  return (
    <motion.aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ width: expanded ? 240 : 68 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex flex-col h-screen bg-white border-r border-black/[0.06] shrink-0 z-20 relative"
      style={{ minWidth: expanded ? 240 : 68 }}
    >
      <div className="flex items-center h-16 border-b border-black/[0.05] shrink-0 px-[18px] overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{
                duration: 0.28,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.06,
              }}
              className="ml-3 font-bold text-slate-900 whitespace-nowrap"
              style={{ fontSize: "1rem" }}
            >
              Skill<span style={{ color: "#2563EB" }}>Bridge</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-0.5">
        {config.mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <div key={item.id} className="relative group/nav">
              <button
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center rounded-xl text-left transition-all duration-200 overflow-hidden ${
                  expanded ? "px-3 py-2.5 gap-3" : "px-0 py-2.5 justify-center"
                } ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`relative shrink-0 ${!expanded ? "mx-auto" : ""}`}>
                  <Icon
                    className="w-[18px] h-[18px] transition-all duration-200"
                    style={{ color: isActive ? "#2563EB" : undefined }}
                  />
                  {isActive && <span className="absolute -inset-1.5 rounded-lg bg-blue-600/10" />}
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{
                        duration: 0.24,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.05,
                      }}
                      className="font-medium whitespace-nowrap overflow-hidden flex-1"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {expanded && item.badge && !isActive && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="ml-auto bg-amber-50 text-amber-600 border border-amber-200 font-bold px-1.5 py-0.5 rounded-md shrink-0"
                      style={{ fontSize: "0.5rem" }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                  {expanded && isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"
                    />
                  )}
                </AnimatePresence>
              </button>

              {!expanded && renderTooltip(item.label)}
            </div>
          );
        })}
      </nav>

      <div className="mx-3 border-t border-black/[0.05]" />

      <div className="py-3 px-3 space-y-0.5 overflow-hidden">
        {config.bottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative group/nav">
              <button
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center rounded-xl text-left transition-all duration-200 overflow-hidden ${
                  expanded ? "px-3 py-2.5 gap-3" : "px-0 py-2.5 justify-center"
                } ${
                  item.danger
                    ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
                    : activeItem === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0 transition-colors duration-200" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{
                        duration: 0.24,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.05,
                      }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {!expanded && renderTooltip(item.label, false)}
            </div>
          );
        })}
      </div>

      <div className="mx-3 mb-3 mt-1 overflow-hidden">
        <div
          className={`flex items-center rounded-xl p-3 bg-slate-50 border border-black/[0.05] transition-all duration-200 ${!expanded ? "justify-center" : "gap-3"}`}
        >
          <div
            className={`w-7 h-7 rounded-lg ${config.user.avatarClassName} flex items-center justify-center text-white shrink-0 overflow-hidden`}
            style={{ fontSize: "0.6rem", fontWeight: 800 }}
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayInitials
            )}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{
                  duration: 0.26,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.06,
                }}
                className="min-w-0 overflow-hidden"
              >
                <p
                  className="text-slate-900 font-semibold truncate"
                  style={{ fontSize: "0.74rem" }}
                >
                  {displayName}
                </p>
                <p className="text-slate-400 truncate" style={{ fontSize: "0.6rem" }}>
                  {displayRole}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

function TopNavbar({
  title,
  role,
  currentUser,
  onMobileMenuOpen,
  onLogout,
}: {
  title: string;
  role: DashboardRole;
  currentUser: DashboardCurrentUser | null;
  onMobileMenuOpen: () => void;
  onLogout: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const config = roleConfig[role];
  const displayName = currentUser?.fullName ?? "";
  const displayRole = currentUser?.role ? formatRole(currentUser.role) : "";
  const displayInitials = displayName ? getInitials(displayName) : "";
  const displayAvatar = currentUser?.avatar;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-black/[0.05] flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-slate-900 tracking-tight" style={{ fontSize: "1rem", fontWeight: 700 }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-xl ${config.user.avatarClassName} flex items-center justify-center text-white overflow-hidden`}
              style={{ fontSize: "0.65rem", fontWeight: 800 }}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayInitials
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p
                className="text-slate-900 font-semibold leading-tight"
                style={{ fontSize: "0.8rem" }}
              >
                {displayName}
              </p>
              <p
                className="leading-tight"
                style={{
                  fontSize: "0.62rem",
                  color: config.user.labelColor,
                  fontWeight: 600,
                }}
              >
                {displayRole}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-black/[0.06] rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-1.5">
                  {config.dropdownActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => {
                          navigate(action.path);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                        style={{ fontSize: "0.82rem" }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-black/[0.05] p-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                    style={{ fontSize: "0.82rem" }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  role,
  activeItem,
  onItemClick,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  role: DashboardRole;
  activeItem: DashboardNavId;
  onItemClick: (id: DashboardNavId) => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const config = roleConfig[role];

  const handleNav = (id: DashboardNavId) => {
    if (id === "logout") {
      onClose();
      onLogout();
      return;
    }

    onItemClick(id);
    const path = getDashboardPath(role, id);
    if (path) navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 bottom-0 w-64 bg-white z-40 flex flex-col shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-black/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" fill="white" />
                </div>
                <span className="font-bold text-slate-900" style={{ fontSize: "0.95rem" }}>
                  Skill<span style={{ color: "#2563EB" }}>Bridge</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {config.mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium flex-1" style={{ fontSize: "0.85rem" }}>
                      {item.label}
                    </span>
                    {item.badge && !isActive && (
                      <span
                        className="bg-amber-50 text-amber-600 border border-amber-200 font-bold px-1.5 py-0.5 rounded-md"
                        style={{ fontSize: "0.5rem" }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </nav>

            <div className="mx-4 border-t border-black/[0.05]" />

            <div className="py-3 px-3 space-y-0.5">
              {config.bottomNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                      item.danger
                        ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium" style={{ fontSize: "0.85rem" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DashboardLayout({
  role,
  title,
  activeNav = "dashboard",
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<DashboardNavId>(activeNav as DashboardNavId);
  const [currentUser, setCurrentUser] = useState<DashboardCurrentUser | null>(null);
  const loggingOutRef = useRef(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const showSuspensionNotice = role !== "admin" && isAccountSuspended(currentUser);

  useEffect(() => {
    let mounted = true;

    const refreshCurrentUser = () => {
      loadDashboardCurrentUser().then((user) => {
        if (loggingOutRef.current) return;
        if (mounted) setCurrentUser(user);
      });
    };

    refreshCurrentUser();
    // Profile and verification flows dispatch this after changing user-visible account data.
    window.addEventListener("skillbridge:user-updated", refreshCurrentUser);

    return () => {
      mounted = false;
      window.removeEventListener("skillbridge:user-updated", refreshCurrentUser);
    };
  }, []);

  const handleLogout = async () => {
    setNotification(null);
    loggingOutRef.current = true;
    setCurrentUser(null);

    try {
      await logoutUser();
      setNotification({ type: "success", text: "Logout successful." });
      await wait(2000);
      navigate(role === "admin" ? "/admin/login" : "/", { replace: true });
    } catch (error) {
      loggingOutRef.current = false;
      const user = await loadDashboardCurrentUser();
      setCurrentUser(user);
      console.error("Logout failed:", error);
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Logout failed. Please try again.",
      });
    }
  };

  return (
    <DashboardCurrentUserContext.Provider value={currentUser}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-screen overflow-hidden bg-slate-50"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Sidebar
          role={role}
          currentUser={currentUser}
          activeItem={activeItem}
          onItemClick={setActiveItem}
          onLogout={handleLogout}
        />

        <MobileDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          role={role}
          activeItem={activeItem}
          onItemClick={setActiveItem}
          onLogout={handleLogout}
        />

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TopNavbar
            title={title}
            role={role}
            currentUser={currentUser}
            onMobileMenuOpen={() => setMobileOpen(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="p-6 lg:p-8 max-w-6xl"
            >
              {showSuspensionNotice && (
                <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-red-200 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-red-700 font-bold" style={{ fontSize: "0.95rem" }}>
                      Account Suspended
                    </h2>
                    <p
                      className="text-red-600 mt-1 leading-relaxed"
                      style={{ fontSize: "0.82rem" }}
                    >
                      Your SkillBridge account has been temporarily suspended. Some marketplace
                      features have been disabled. If you believe this is a mistake, please contact
                      the administrator.
                    </p>
                    {currentUser?.suspensionReason && (
                      <div className="mt-3 bg-white border border-red-200 rounded-xl px-3 py-2">
                        <p className="text-red-400 font-semibold" style={{ fontSize: "0.68rem" }}>
                          Suspension Reason
                        </p>
                        <p
                          className="text-red-700 font-semibold mt-0.5"
                          style={{ fontSize: "0.78rem" }}
                        >
                          {currentUser.suspensionReason}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 inline-flex items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-1.5">
                      <span className="text-red-400 font-semibold" style={{ fontSize: "0.68rem" }}>
                        Status
                      </span>
                      <span className="text-red-700 font-bold" style={{ fontSize: "0.72rem" }}>
                        Suspended
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {children}
            </motion.div>
          </main>
        </div>
        <Notification message={notification} onClose={() => setNotification(null)} />
      </motion.div>
    </DashboardCurrentUserContext.Provider>
  );
}
