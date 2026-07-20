import { useEffect, useState } from "react";
import {
  DashboardLayout,
  useDashboardCurrentUser,
} from "../../app/components/layout/DashboardLayout";
import { useNavigate } from "react-router";
import { Search, Folder, CheckCircle, FileText, ChevronRight } from "lucide-react";
import { WelcomeCard } from "../../app/components/shared/WelcomeCard";
import { StatGrid } from "../../app/components/shared/StatCard";
import { QuickActionsGrid } from "../../app/components/shared/QuickActionCard";
import { SectionCard } from "../../app/components/shared/SectionCard";
import { VerificationReminderCard } from "../../app/components/shared/VerificationReminderCard";
import { APPLICATION_STATUS_CFG } from "../../app/components/shared/ApplicationDetailsContent";
import { PROJECT_STATUS_CFG } from "../../app/data/projects";
import { getMyProjects, type MyProjectsResponse } from "../../services/projectService";
import { getMyApplications, type MyApplicationsResponse } from "../../services/applicationService";

function formatAppliedDate(date?: string) {
  if (!date) return "Date not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date not available";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isActiveProjectStatus(status: string) {
  return status === "active" || status === "submitted" || status === "revision_requested";
}

function StudentDashboardContent() {
  const navigate = useNavigate();
  const currentUser = useDashboardCurrentUser();
  const isVerified = currentUser?.isVerified === true;
  const [projectData, setProjectData] = useState<MyProjectsResponse>({
    totalProjects: 0,
    projects: [],
  });
  const [applicationData, setApplicationData] = useState<MyApplicationsResponse>({
    totalApplications: 0,
    applications: [],
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const projects = projectData.projects;
  const applications = applicationData.applications;
  const active = projects.filter((project) => isActiveProjectStatus(project.status)).slice(0, 3);
  const activeProjectsCount = projects.filter((project) =>
    isActiveProjectStatus(project.status)
  ).length;
  const completedProjectsCount = projects.filter(
    (project) => project.status === "completed"
  ).length;
  const recentApplications = applications.slice(0, 3);
  const studentStats = [
    {
      value: loadingDashboard ? "..." : applicationData.totalApplications,
      label: "Total Applications",
      icon: FileText,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      value: loadingDashboard ? "..." : activeProjectsCount,
      label: "Active Projects",
      icon: Folder,
      color: "#14B8A6",
      bg: "#F0FDFA",
    },
    {
      value: loadingDashboard ? "..." : completedProjectsCount,
      label: "Completed Projects",
      icon: CheckCircle,
      color: "#059669",
      bg: "#ECFDF5",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      setLoadingDashboard(true);
      setDashboardError("");

      try {
        const [applicationsResponse, projectsResponse] = await Promise.all([
          getMyApplications(),
          getMyProjects(),
        ]);

        if (!mounted) return;

        setApplicationData(applicationsResponse.data);
        setProjectData(projectsResponse.data);
      } catch (error) {
        if (!mounted) return;

        setDashboardError(
          error instanceof Error ? error.message : "Dashboard data could not be loaded."
        );
        setApplicationData({
          totalApplications: 0,
          applications: [],
        });
        setProjectData({
          totalProjects: 0,
          projects: [],
        });
      } finally {
        if (mounted) {
          setLoadingDashboard(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <VerificationReminderCard />

      <WelcomeCard
        name="Ramit Sonar"
        subtitle="Build experience and grow your professional portfolio. Your next opportunity is waiting."
        actions={[
          {
            label: "Browse Jobs",
            onClick: () => navigate("/dashboard/student/browse-jobs"),
            primary: true,
          },
          ...(!isVerified
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
            {loadingDashboard ? (
              <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                Loading applications...
              </p>
            ) : dashboardError ? (
              <p className="text-red-500 text-center py-6" style={{ fontSize: "0.82rem" }}>
                {dashboardError}
              </p>
            ) : recentApplications.length === 0 ? (
              <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                No applications submitted yet.
              </p>
            ) : (
              recentApplications.map((application, i) => {
                const cfg = APPLICATION_STATUS_CFG[application.status];
                const title = application.job?.title ?? "Job unavailable";

                return (
                  <div
                    key={application.applicationId}
                    className={`flex items-center justify-between gap-3 py-3 ${i < recentApplications.length - 1 ? "border-b border-black/[0.04]" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-slate-900 font-semibold truncate"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {title}
                      </p>
                      <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                        Applied {formatAppliedDate(application.appliedAt)}
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
                        onClick={() => navigate("/dashboard/student/applications")}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        {/* Active Projects */}
        <SectionCard title="Active Projects" subtitle="Your ongoing project work.">
          {loadingDashboard ? (
            <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
              Loading projects...
            </p>
          ) : dashboardError ? (
            <p className="text-red-500 text-center py-6" style={{ fontSize: "0.82rem" }}>
              {dashboardError}
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
                        {[p.client?.name, p.deadline ? `Due ${p.deadline}` : ""]
                          .filter(Boolean)
                          .join(" - ") || "Project details unavailable"}
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
  );
}

export default function StudentDashboard() {
  return (
    <DashboardLayout role="student" title="Dashboard" activeNav="dashboard">
      <StudentDashboardContent />
    </DashboardLayout>
  );
}
