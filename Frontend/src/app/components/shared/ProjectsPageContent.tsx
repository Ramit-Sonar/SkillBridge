import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { PROJECT_STATUS_CFG, type ProjectStatus } from "../../data/projects";
import { getMyProjects, type MyProjectsResponse } from "../../../services/projectService";
import { DashboardLayout } from "../layout/DashboardLayout";
import { FilterChipGroup, SearchInput } from "./ui";
import { ProjectListContent } from "./ProjectListContent";

type ProjectsPageContentProps = {
  role: "student" | "client";
  title: string;
  heading: string;
  description: string;
  searchPlaceholder: string;
  EmptyIcon: LucideIcon;
  getSearchText: (project: MyProjectsResponse["projects"][number]) => string;
};

const FILTERS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Submitted", value: "submitted" },
  { label: "Revision", value: "revision_requested" },
  { label: "Completed", value: "completed" },
];

export function ProjectsPageContent({
  role,
  title,
  heading,
  description,
  searchPlaceholder,
  EmptyIcon,
  getSearchText,
}: ProjectsPageContentProps) {
  const [projectData, setProjectData] = useState<MyProjectsResponse>({
    totalProjects: 0,
    projects: [],
  });
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const projects = projectData.projects;

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
    const matchesSearch = !q || getSearchText(project).toLowerCase().includes(q);

    return matchesSearch && (filter === "all" || project.status === filter);
  });

  return (
    <DashboardLayout role={role} title={title} activeNav="projects">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              {heading}
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <EmptyIcon className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-600 font-semibold" style={{ fontSize: "0.78rem" }}>
              {projectData.totalProjects} projects
            </span>
          </div>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />

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
          role={role}
          EmptyIcon={EmptyIcon}
          onRetry={loadProjects}
        />
      </motion.div>
    </DashboardLayout>
  );
}
