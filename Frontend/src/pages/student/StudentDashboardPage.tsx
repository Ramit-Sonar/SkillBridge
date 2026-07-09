import { useEffect, useState } from "react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { useNavigate } from "react-router";
import { Search, Folder, CheckCircle, FileText, ChevronRight } from "lucide-react";
import { WelcomeCard } from "../../app/components/shared/WelcomeCard";
import { StatGrid } from "../../app/components/shared/StatCard";
import { QuickActionsGrid } from "../../app/components/shared/QuickActionCard";
import { SectionCard } from "../../app/components/shared/SectionCard";
import { VerificationReminderCard } from "../../app/components/shared/VerificationReminderCard";
import { PROJECT_STATUS_CFG } from "../../app/data/projects";
import { getMyProjects, type MyProjectsResponse } from "../../services/projectService";

const IS_VERIFIED = false;

const RECENT_APPS = [
  {
    title: "Landing Page Design for EdTech",
    status: "Pending",
    statusColor: "#D97706",
    statusBg: "#FFFBEB",
    applied: "10 Jun 2026",
  },
  {
    title: "React Portfolio Website",
    status: "Accepted",
    statusColor: "#059669",
    statusBg: "#ECFDF5",
    applied: "8 Jun 2026",
  },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState<MyProjectsResponse>({
    totalProjects: 0,
    projects: [],
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");
  const projects = projectData.projects;
  const active = projects
    .filter((project) => project.status === "active" || project.status === "submitted")
    .slice(0, 3);
  const activeProjectsCount = projects.filter(
    (project) => project.status === "active" || project.status === "submitted"
  ).length;
  const completedProjectsCount = projects.filter(
    (project) => project.status === "completed"
  ).length;
  const studentStats = [
    { value: 2, label: "Total Applications", icon: FileText, color: "#2563EB", bg: "#EFF6FF" },
    {
      value: activeProjectsCount,
      label: "Active Projects",
      icon: Folder,
      color: "#14B8A6",
      bg: "#F0FDFA",
    },
    {
      value: completedProjectsCount,
      label: "Completed Projects",
      icon: CheckCircle,
      color: "#059669",
      bg: "#ECFDF5",
    },
  ];

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      setProjectError("");

      try {
        const response = await getMyProjects();
        setProjectData(response.data);
      } catch (error) {
        setProjectError(error instanceof Error ? error.message : "Projects could not be loaded.");
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <DashboardLayout role="student" title="Dashboard" activeNav="dashboard">
      <div className="flex flex-col gap-5">
        <VerificationReminderCard isVerified={IS_VERIFIED} />

        <WelcomeCard
          name="Ramit Sonar"
          subtitle="Build experience and grow your professional portfolio. Your next opportunity is waiting."
          actions={[
            {
              label: "Browse Jobs",
              onClick: () => navigate("/dashboard/student/browse-jobs"),
              primary: true,
            },
            ...(!IS_VERIFIED
              ? [
                  {
                    label: "Verify Account",
                    onClick: () => navigate("/dashboard/student/settings"),
                  },
                ]
              : []),
          ]}
        />

        <StatGrid stats={studentStats} />

        <QuickActionsGrid
          columns="sm:grid-cols-3"
          actions={[
            {
              icon: Search,
              title: "Browse Jobs",
              description: "Explore live project briefs.",
              color: "#14B8A6",
              bg: "#F0FDFA",
              onClick: () => navigate("/dashboard/student/browse-jobs"),
            },
            {
              icon: FileText,
              title: "My Applications",
              description: "Track all your applications.",
              color: "#F59E0B",
              bg: "#FFFBEB",
              onClick: () => navigate("/dashboard/student/applications"),
            },
            {
              icon: Folder,
              title: "My Projects",
              description: "View your active projects.",
              color: "#7C3AED",
              bg: "#F5F3FF",
              onClick: () => navigate("/dashboard/student/projects"),
            },
          ]}
        />

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recent Applications */}
          <SectionCard title="Recent Applications" subtitle="Your latest job application activity.">
            <div className="flex flex-col gap-0">
              {RECENT_APPS.map((a, i) => (
                <div
                  key={a.title}
                  className={`flex items-center justify-between gap-3 py-3 ${i < RECENT_APPS.length - 1 ? "border-b border-black/[0.04]" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-slate-900 font-semibold truncate"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {a.title}
                    </p>
                    <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                      Applied {a.applied}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: a.statusBg, color: a.statusColor, fontSize: "0.62rem" }}
                    >
                      {a.status}
                    </span>
                    <button
                      onClick={() => navigate("/dashboard/student/applications")}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Active Projects */}
          <SectionCard title="Active Projects" subtitle="Your ongoing project work.">
            {loadingProjects ? (
              <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                Loading projects...
              </p>
            ) : projectError ? (
              <p className="text-red-500 text-center py-6" style={{ fontSize: "0.82rem" }}>
                {projectError}
              </p>
            ) : active.length === 0 ? (
              <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                No active projects yet.
              </p>
            ) : (
              <div className="flex flex-col gap-0">
                {active.map((p, i) => {
                  const cfg = PROJECT_STATUS_CFG[p.status];
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between gap-3 py-3 ${i < active.length - 1 ? "border-b border-black/[0.04]" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-slate-900 font-semibold truncate"
                          style={{ fontSize: "0.82rem" }}
                        >
                          {p.title}
                        </p>
                        <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                          Due {p.deadline}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className="font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, fontSize: "0.62rem" }}
                        >
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => navigate(`/dashboard/student/projects/${p.id}`)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
