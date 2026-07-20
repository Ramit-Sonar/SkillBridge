import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { ProjectListContent } from "../../app/components/shared/ProjectListContent";
import { FilterChipGroup, SearchInput } from "../../app/components/shared/ui";
import { Folder } from "lucide-react";
import { PROJECT_STATUS_CFG, type ProjectStatus } from "../../app/data/projects";
import { getMyProjects, type MyProjectsResponse } from "../../services/projectService";

const FILTERS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Submitted", value: "submitted" },
  { label: "Revision", value: "revision_requested" },
  { label: "Completed", value: "completed" },
];

export default function StudentProjectsPage() {
  const [projectData, setProjectData] = useState<MyProjectsResponse>({
    totalProjects: 0,
    projects: [],
  });
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const projects = projectData.projects;

  // Load the authenticated student's project workspace summaries from the backend.
  const loadProjects = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await getMyProjects();
      setProjectData(response.data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const counts: Record<string, number> = { all: projects.length };
  projects.forEach((project) => {
    counts[project.status] = (counts[project.status] ?? 0) + 1;
  });

  const filtered = projects.filter((project) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      project.title.toLowerCase().includes(q) ||
      project.category.toLowerCase().includes(q) ||
      project.client?.name.toLowerCase().includes(q);

    return matchesSearch && (filter === "all" || project.status === filter);
  });

  return (
    <DashboardLayout role="student" title="Projects" activeNav="projects">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              My Projects
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Track submissions, revisions, and completed project work.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Folder className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-600 font-semibold" style={{ fontSize: "0.78rem" }}>
              {projectData.totalProjects} projects
            </span>
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by project title, client, or category..."
        />

        <FilterChipGroup
          items={FILTERS.map((filterItem) => ({
            ...filterItem,
            count: counts[filterItem.value] ?? 0,
            config: filterItem.value !== "all" ? PROJECT_STATUS_CFG[filterItem.value] : undefined,
          }))}
          activeValue={filter}
          onChange={setFilter}
        />

        <ProjectListContent
          loading={loading}
          loadError={loadError}
          projects={filtered}
          role="student"
          EmptyIcon={Folder}
          onRetry={loadProjects}
        />
      </motion.div>
    </DashboardLayout>
  );
}
