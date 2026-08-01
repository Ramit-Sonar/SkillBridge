import { Folder } from "lucide-react";
import { ProjectsPageContent } from "../../app/components/shared/ProjectsPageContent";

export default function StudentProjectsPage() {
  return (
    <ProjectsPageContent
      role="student"
      title="Projects"
      heading="My Projects"
      description="Track submissions, revisions, and completed project work."
      searchPlaceholder="Search by project title, client, or category..."
      EmptyIcon={Folder}
      getSearchText={(project) =>
        `${project.title} ${project.category} ${project.client?.name ?? ""}`
      }
    />
  );
}
