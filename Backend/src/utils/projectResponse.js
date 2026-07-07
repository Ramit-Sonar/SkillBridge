const SUBMISSION_STATUS_LABELS = {
  submitted: "Submitted",
  approved: "Approved",
};

const SUBMITTABLE_PROJECT_STATUSES = ["active", "revision_requested"];

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

export const buildProjectWorkspace = ({
  project,
  viewerRole,
  partnerProfile,
  partnerVerification,
}) => {
  const partner = viewerRole === "student" ? project.client : project.student;
  const partnerRole = viewerRole === "student" ? "client" : "student";

  const projectSummary = {
    projectId: project._id,
    status: project.status,
    startedAt: project.startedAt,
    completedAt: project.completedAt,
    lastActivityAt: project.lastActivityAt,
  };

  const partnerSummary = partner
    ? {
        userId: partner._id,
        role: partnerRole,
        fullName: partner.fullName,
        avatar: partner.avatar || "",
      }
    : null;

  if (partnerSummary && viewerRole === "student") {
    partnerSummary.companyName = partnerProfile?.companyName || "";
  }

  if (partnerSummary && viewerRole === "client") {
    partnerSummary.headline =
      partnerProfile?.education || partnerProfile?.university || "";
    partnerSummary.verifiedBadge = partnerVerification?.status === "approved";
  }

  return {
    project: projectSummary,
    overview: {
      ...projectSummary,
      partner: partnerSummary,
    },
    job: project.job
      ? {
          jobId: project.job._id,
          title: project.job.title,
          category: project.job.category,
          budget: project.job.budget,
          deadline: project.job.deadline,
          verificationRequirement: project.job.verificationRequirement,
        }
      : null,
    application: project.application
      ? {
          applicationId: project.application._id,
          coverMessage: project.application.coverMessage,
          estimatedCompletionTime: project.application.estimatedCompletionTime,
          whySuitable: project.application.whySuitable,
          attachments: project.application.attachments || [],
          appliedAt: project.application.appliedAt,
        }
      : null,
    partner: partnerSummary,
  };
};

export const buildDeliverablesSummary = ({ project, deliverables }) => {
  const latestSubmission = deliverables[0] || null;

  return {
    project: {
      projectId: project._id,
      status: project.status,
      canSubmit: SUBMITTABLE_PROJECT_STATUSES.includes(project.status),
    },
    latestSubmission: latestSubmission
      ? {
          deliverableId: latestSubmission._id,
          versionNumber: latestSubmission.versionNumber,
          notes: latestSubmission.notes,
          demoLink: latestSubmission.demoLink,
          repositoryLink: latestSubmission.repositoryLink,
          liveUrl: latestSubmission.liveUrl,
          attachments: latestSubmission.attachments || [],
          submittedAt: latestSubmission.submittedAt,
          submittedBy: latestSubmission.submittedBy,
          status: latestSubmission.status,
          approvedAt: latestSubmission.approvedAt,
        }
      : null,
    versionHistory: deliverables.map((deliverable) => ({
      deliverableId: deliverable._id,
      versionNumber: deliverable.versionNumber,
      submittedAt: deliverable.submittedAt,
      status: deliverable.status,
    })),
  };
};

export const buildApproveDeliverableResponse = ({ project }) => ({
  project: {
    projectId: project._id,
    status: project.status,
    completedAt: project.completedAt,
    lastActivityAt: project.lastActivityAt,
  },
  completedAt: project.completedAt,
});

export const buildRequestRevisionResponse = ({ project, revision }) => ({
  project: {
    projectId: project._id,
    status: project.status,
    lastActivityAt: project.lastActivityAt,
  },
  revision: {
    revisionId: revision._id,
    revisionNumber: revision.revisionNumber,
    requestedAt: revision.requestedAt,
    message: revision.message,
    attachments: revision.attachments || [],
    referenceLinks: revision.referenceLinks || [],
    resolved: revision.resolved,
  },
});

export const buildSubmitDeliverableResponse = ({ project, deliverable }) => ({
  project: {
    projectId: project._id,
    status: project.status,
    startedAt: project.startedAt,
    completedAt: project.completedAt,
    lastActivityAt: project.lastActivityAt,
  },
  latestDeliverable: {
    deliverableId: deliverable._id,
    versionNumber: deliverable.versionNumber,
    submittedAt: deliverable.submittedAt,
    status: deliverable.status,
    notes: deliverable.notes,
    demoLink: deliverable.demoLink,
    repositoryLink: deliverable.repositoryLink,
    liveUrl: deliverable.liveUrl,
    attachments: deliverable.attachments || [],
  },
});
