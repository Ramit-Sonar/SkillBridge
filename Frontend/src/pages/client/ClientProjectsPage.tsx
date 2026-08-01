import { Users } from "lucide-react";
import { ProjectsPageContent } from "../../app/components/shared/ProjectsPageContent";

export default function ClientProjectsPage() {
  return (
    <ProjectsPageContent
      role="client"
      title="Projects"
      heading="Projects"
      description="Monitor submitted work, revisions, and approvals."
      searchPlaceholder="Search by project title, student, or category..."
      EmptyIcon={Users}
      getSearchText={(project) =>
        `${project.title} ${project.student?.name ?? ""} ${project.category}`
      }
    />
  );
}
