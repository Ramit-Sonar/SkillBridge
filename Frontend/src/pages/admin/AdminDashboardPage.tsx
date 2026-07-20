import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { VERIFICATION_REQUESTS, CLIENT_KYC_REQUESTS, PLATFORM_USERS } from "../../app/data/admin";
import { GraduationCap, Users, ArrowRight, Clock, CheckCircle, Folder } from "lucide-react";
import { WelcomeCard } from "../../app/components/shared/WelcomeCard";
import { StatGrid } from "../../app/components/shared/StatCard";
import { QuickActionsGrid } from "../../app/components/shared/QuickActionCard";
import { SectionCard } from "../../app/components/shared/SectionCard";

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

// Pending tasks still read from local fixtures until this dashboard is API-backed.

function PendingTasks() {
  const navigate = useNavigate();
  const tasks = VERIFICATION_REQUESTS.filter((v) => v.status === "pending")
    .slice(0, 5)
    .map((v) => ({
      id: v.id,
      icon: Clock,
      iconColor: "#D97706",
      iconBg: "#FEF3C7",
      text: `${v.name} submitted a student verification request`,
      time: v.submittedAt,
      path: "/admin/students",
    }));

  return (
    <SectionCard
      title="Pending Tasks"
      subtitle={`${tasks.length} item${tasks.length !== 1 ? "s" : ""} require your attention`}
    >
      {tasks.length === 0 ? (
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
            const Icon = task.icon;
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
                  style={{ background: task.iconBg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: task.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-slate-900 leading-snug"
                    style={{ fontSize: "0.8rem", fontWeight: 500 }}
                  >
                    {task.text}
                  </p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                    {task.time}
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

  const studentPending = VERIFICATION_REQUESTS.filter((v) => v.status === "pending").length;
  const clientPending = CLIENT_KYC_REQUESTS.filter((c) => c.status === "pending").length;
  const pending = studentPending + clientPending;
  const students = PLATFORM_USERS.filter((u) => u.role === "student").length;
  const clients = PLATFORM_USERS.filter((u) => u.role === "client").length;

  const stats = [
    {
      value: pending,
      label: "Pending Verifications",
      icon: GraduationCap,
      color: "#D97706",
      bg: "#FEF3C7",
      onClick: () => navigate("/admin/students"),
    },
    {
      value: students,
      label: "Total Students",
      icon: Users,
      color: "#2563EB",
      bg: "#EFF6FF",
      onClick: () => navigate("/admin/users"),
    },
    {
      value: clients,
      label: "Total Clients",
      icon: Folder,
      color: "#7C3AED",
      bg: "#F5F3FF",
      onClick: () => navigate("/admin/users"),
    },
    {
      value: 1,
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
        <PendingTasks />
      </div>
    </DashboardLayout>
  );
}
