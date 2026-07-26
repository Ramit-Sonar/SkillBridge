import { useNavigate } from "react-router";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import {
  PlusCircle,
  Briefcase,
  FolderOpen,
  CheckCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { WelcomeCard } from "../../app/components/shared/WelcomeCard";
import { StatGrid } from "../../app/components/shared/StatCard";
import { QuickActionsGrid } from "../../app/components/shared/QuickActionCard";
import { SectionCard } from "../../app/components/shared/SectionCard";
import { VerificationReminderCard } from "../../app/components/shared/VerificationReminderCard";
import { getClientJobs, type JobData } from "../../services/jobService";
import { getMyProjects, type ProjectSummary } from "../../services/projectService";

const JOB_STATUS_CONFIG = {
  open: { label: "Open", color: "#059669", bg: "#ECFDF5" },
  closed: { label: "Closed", color: "#64748B", bg: "#F8FAFC" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  suspended: { label: "Suspended", color: "#DC2626", bg: "#FEF2F2" },
};

function formatPostedDate(date?: string) {
  if (!date) return "Date not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date not available";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isActiveProject(project: ProjectSummary) {
  return (
    project.status === "active" ||
    project.status === "submitted" ||
    project.status === "revision_requested"
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoadingDashboard(true);
      setDashboardError("");

      try {
        // Dashboard counters are derived from the real jobs and projects lists.
        const [jobsResponse, projectsResponse] = await Promise.all([
          getClientJobs(),
          getMyProjects(),
        ]);

        if (!mounted) return;

        setJobs(jobsResponse.data);
        setProjects(projectsResponse.data.projects);
      } catch (error) {
        if (!mounted) return;

        setDashboardError(
          error instanceof Error ? error.message : "Dashboard data could not be loaded."
        );
        setJobs([]);
        setProjects([]);
      } finally {
        if (mounted) {
          setLoadingDashboard(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const totalApplications = jobs.reduce((total, job) => total + (job.applicationCount ?? 0), 0);
  const pendingActions = jobs.filter((job) => (job.pendingApplicationCount ?? 0) > 0);
  const recentJobs = jobs.slice(0, 3);
  const clientStats = [
    {
      value: loadingDashboard ? "..." : jobs.length,
      label: "Jobs Posted",
      icon: Briefcase,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      value: loadingDashboard ? "..." : jobs.filter((job) => job.status === "open").length,
      label: "Open Jobs",
      icon: FolderOpen,
      color: "#14B8A6",
      bg: "#F0FDFA",
    },
    {
      value: loadingDashboard ? "..." : totalApplications,
      label: "Applications Received",
      icon: FileText,
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
    {
      value: loadingDashboard ? "..." : projects.filter(isActiveProject).length,
      label: "Active Projects",
      icon: CheckCircle,
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
  ];

  return (
    <DashboardLayout role="client" title="Dashboard" activeNav="dashboard">
      <div className="flex flex-col gap-5">
        <VerificationReminderCard
          description="Complete KYC verification to start posting jobs and build trust with students."
          settingsPath="/dashboard/client/settings"
        />
        <WelcomeCard
          name="Dikshya Khanal"
          subtitle="Manage your jobs, review applications, and collaborate with talented students."
          actions={[
            {
              label: "Post a Job",
              onClick: () => navigate("/dashboard/client/post-job"),
              primary: true,
            },
          ]}
        />
        <StatGrid stats={clientStats} columns="grid-cols-2 sm:grid-cols-4" />
        <QuickActionsGrid
          actions={[
            {
              icon: PlusCircle,
              title: "Post a Job",
              description: "Publish a new project brief.",
              color: "#2563EB",
              bg: "#EFF6FF",
              onClick: () => navigate("/dashboard/client/post-job"),
            },
            {
              icon: Briefcase,
              title: "Manage Jobs",
              description: "View and manage your jobs.",
              color: "#14B8A6",
              bg: "#F0FDFA",
              onClick: () => navigate("/dashboard/client/manage-jobs"),
            },
            {
              icon: FolderOpen,
              title: "Projects",
              description: "Monitor active projects.",
              color: "#F59E0B",
              bg: "#FFFBEB",
              onClick: () => navigate("/dashboard/client/projects"),
            },
          ]}
          columns="sm:grid-cols-3"
        />
        {dashboardError && (
          <p className="text-red-500" style={{ fontSize: "0.78rem" }}>
            {dashboardError}
          </p>
        )}
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Pending Actions" subtitle="Items requiring your attention.">
            <div className="flex flex-col gap-0">
              {loadingDashboard ? (
                <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                  Loading pending actions...
                </p>
              ) : pendingActions.length === 0 ? (
                <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                  No pending applications to review.
                </p>
              ) : (
                pendingActions.map((job, i) => {
                  const pendingCount = job.pendingApplicationCount ?? 0;

                  return (
                    <div
                      key={job._id ?? job.title}
                      className={`flex items-start justify-between gap-3 py-3.5 ${i < pendingActions.length - 1 ? "border-b border-black/[0.04]" : ""}`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: "#EFF6FF" }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ background: "#2563EB" }} />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-slate-900 font-semibold"
                            style={{ fontSize: "0.82rem" }}
                          >
                            {pendingCount} New Application{pendingCount !== 1 ? "s" : ""}
                          </p>
                          <p
                            className="text-slate-500 mt-0.5 leading-snug"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {job.title} has {pendingCount} unreviewed application
                            {pendingCount !== 1 ? "s" : ""}.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/dashboard/client/manage-jobs")}
                        className="text-blue-600 hover:text-blue-700 transition-colors shrink-0 mt-1"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
          <SectionCard title="Recent Jobs" subtitle="Your recently posted job listings.">
            <div className="flex flex-col gap-0">
              {loadingDashboard ? (
                <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                  Loading jobs...
                </p>
              ) : recentJobs.length === 0 ? (
                <p className="text-slate-400 text-center py-6" style={{ fontSize: "0.82rem" }}>
                  No jobs posted yet.
                </p>
              ) : (
                recentJobs.map((job, i) => {
                  const status = job.status ?? "open";
                  const cfg = JOB_STATUS_CONFIG[status];
                  const applicationCount = job.applicationCount ?? 0;

                  return (
                    <div
                      key={job._id ?? job.title}
                      className={`flex items-center justify-between gap-3 py-3 ${i < recentJobs.length - 1 ? "border-b border-black/[0.04]" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-slate-900 font-semibold truncate"
                          style={{ fontSize: "0.82rem" }}
                        >
                          {job.title}
                        </p>
                        <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                          {applicationCount} application{applicationCount !== 1 ? "s" : ""} ·{" "}
                          {formatPostedDate(job.createdAt)}
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
                          onClick={() => navigate("/dashboard/client/manage-jobs")}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
