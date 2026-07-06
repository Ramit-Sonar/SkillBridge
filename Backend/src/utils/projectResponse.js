const SUBMISSION_STATUS_LABELS = {
  submitted: "Submitted",
  approved: "Approved",
};

const getCurrentAction = (status, viewerRole, latestSubmission) => {
  if (status === "completed") return "Project completed";

  if (status === "submitted") {
    return viewerRole === "client"
      ? "Review latest submission"
      : "Waiting for client review";
  }

  if (status === "revision_requested") {
    return viewerRole === "student"
      ? "Client requested revisions"
      : "Waiting for student resubmission";
  }

  if (viewerRole === "student") {
    return latestSubmission
      ? "Continue project work"
      : "Submit first deliverables";
  }

  return "Waiting for student submission";
};

export const buildProjectSummary = ({
  project,
  viewerRole,
  latestSubmission,
}) => {
  const partner = viewerRole === "student" ? project.client : project.student;
  const partnerRole = viewerRole === "student" ? "client" : "student";

  return {
    project: {
      projectId: project._id,
      status: project.status,
      startedAt: project.startedAt,
      completedAt: project.completedAt,
      lastActivityAt: project.lastActivityAt,
      currentAction: getCurrentAction(
        project.status,
        viewerRole,
        latestSubmission
      ),
    },
    partner: partner
      ? {
          userId: partner._id,
          role: partnerRole,
          fullName: partner.fullName,
          avatar: partner.avatar || "",
        }
      : null,
    job: project.job
      ? {
          jobId: project.job._id,
          title: project.job.title,
          category: project.job.category,
          budget: project.job.budget,
          deadline: project.job.deadline,
        }
      : null,
    latestSubmission: latestSubmission
      ? {
          versionNumber: latestSubmission.versionNumber,
          submittedAt: latestSubmission.submittedAt,
          status: latestSubmission.status,
          statusLabel:
            SUBMISSION_STATUS_LABELS[latestSubmission.status] ||
            latestSubmission.status,
        }
      : null,
  };
};
