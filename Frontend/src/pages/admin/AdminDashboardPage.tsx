import { useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { GraduationCap, Users, ArrowRight, Clock, CheckCircle, Folder } from "lucide-react";
import { WelcomeCard } from "../../app/components/shared/WelcomeCard";
import { StatGrid } from "../../app/components/shared/StatCard";
import { QuickActionsGrid } from "../../app/components/shared/QuickActionCard";
import { SectionCard } from "../../app/components/shared/SectionCard";
import {
  getAdminDashboardSummary,
  type AdminDashboardSummary,
  type AdminPendingTask,
} from "../../services/adminService";

// Admin shortcuts are kept local because navigation is the only behavior here.

function QuickActionsSection() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: GraduationCap,
      title: "Verification Management",
      description: "Review and manage student and client verification requests.",
      color: "#D97706",
      bg: "#FEF3C7",
      onClick: () => navigate("/admin/students"),
    },
    {
      icon: Users,
      title: "Manage Users",
      description: "Manage student, client, and admin accounts.",
      color: "#2563EB",
      bg: "#EFF6FF",
      onClick: () => navigate("/admin/users"),
    },
  ];
  return <QuickActionsGrid actions={actions} columns="sm:grid-cols-2" />;
}

const emptyDashboardSummary: AdminDashboardSummary = {
  pendingVerifications: 0,
  totalStudents: 0,
  totalClients: 0,
  activeProjects: 0,
  pendingTasks: [],
};

function formatDashboardDate(value?: string) {
  if (!value) return "Not submitted";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PendingTasks({
  tasks,
  loading,
  error,
}: {
  tasks: AdminPendingTask[];
  loading: boolean;
  error: string;
}) {
  const navigate = useNavigate();

  return (
    <SectionCard
      title="Pending Tasks"
      subtitle={`${tasks.length} item${tasks.length !== 1 ? "s" : ""} require your attention`}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <motion.span
            className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-400" style={{ fontSize: "0.82rem" }}>
            Loading dashboard...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-slate-500" style={{ fontSize: "0.82rem" }}>
            {error}
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-slate-400" style={{ fontSize: "0.82rem" }}>
            All caught up — no pending tasks.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {tasks.map((task, i) => {
            const isLast = i === tasks.length - 1;
            return (
              <motion.div
                key={task.id}
                whileHover={{ backgroundColor: "#F8FAFC" }}
                onClick={() => navigate(task.path)}
                className={`flex items-start gap-4 py-3.5 cursor-pointer transition-colors rounded-xl px-2 -mx-2 ${!isLast ? "border-b border-black/[0.04]" : ""}`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#FEF3C7" }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-slate-900 leading-snug"
                    style={{ fontSize: "0.8rem", fontWeight: 500 }}
                  >
                    {task.text}
                  </p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                    {formatDashboardDate(task.submittedAt)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AdminDashboardSummary>(emptyDashboardSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminDashboardSummary();
      setSummary(response.data);
    } catch (dashboardError) {
      setSummary(emptyDashboardSummary);
      setError(
        dashboardError instanceof Error ? dashboardError.message : "Dashboard could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = [
    {
      value: summary.pendingVerifications,
      label: "Pending Verifications",
      icon: GraduationCap,
      color: "#D97706",
      bg: "#FEF3C7",
      onClick: () => navigate("/admin/students"),
    },
    {
      value: summary.totalStudents,
      label: "Total Students",
      icon: Users,
      color: "#2563EB",
      bg: "#EFF6FF",
      onClick: () => navigate("/admin/users"),
    },
    {
      value: summary.totalClients,
      label: "Total Clients",
      icon: Folder,
      color: "#7C3AED",
      bg: "#F5F3FF",
      onClick: () => navigate("/admin/users"),
    },
    {
      value: summary.activeProjects,
      label: "Active Projects",
      icon: CheckCircle,
      color: "#059669",
      bg: "#ECFDF5",
      onClick: () => navigate("/admin/users"),
    },
  ];

  return (
    <DashboardLayout role="admin" title="Dashboard" activeNav="dashboard">
      <div className="flex flex-col gap-6">
        <WelcomeCard
          name="Admin"
          subtitle="Monitor platform activity, verify students, and keep SkillBridge running smoothly."
          actions={[
            {
              label: "Review Verifications",
              onClick: () => navigate("/admin/students"),
              primary: true,
            },
          ]}
        />
        <StatGrid stats={stats} />
        <QuickActionsSection />
        <PendingTasks tasks={summary.pendingTasks} loading={loading} error={error} />
      </div>
    </DashboardLayout>
  );
}
