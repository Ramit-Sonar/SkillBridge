import { buildProfileSkillList } from "./project.service.js";
import { getInitials } from "../utils/text.js";

const SUBMITTABLE_PROJECT_STATUSES = ["active", "revision_requested"];

/**
 * Builds project API response shapes consumed by workspace and project list views.
 */
const formatCardDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCardBudget = (budget) => {
  if (budget === undefined || budget === null) return "";

  return new Intl.NumberFormat("en-US").format(Number(budget));
};

const buildProjectPerson = (user) => {
  if (!user?.fullName) return null;

  return {
    name: user.fullName,
    initials: getInitials(user.fullName),
    avatar: user.avatar || "",
  };
};

const buildProjectStatus = (project) => ({
  id: project._id?.toString(),
  status: project.status,
  startedAt: project.startedAt,
  completedAt: project.completedAt,
  lastActivityAt: project.lastActivityAt,
});

const buildDetailedSubmission = (submission) => {
  if (!submission) return null;

  return {
    id: submission._id?.toString(),
    versionNumber: submission.versionNumber,
    label: `Version ${submission.versionNumber}`,
    notes: submission.notes,
    demoLink: submission.demoLink,
    repositoryLink: submission.repositoryLink,
    liveUrl: submission.liveUrl,
    attachments: submission.attachments || [],
    submittedAt: submission.submittedAt,
    status: submission.status,
    approvedAt: submission.approvedAt,
  };
};

const buildSubmissionHistoryItem = (submission) => ({
  id: submission._id?.toString(),
  versionNumber: submission.versionNumber,
  label: `Version ${submission.versionNumber}`,
  status: submission.status,
  submittedAt: submission.submittedAt,
});

const buildRevisionRequest = (revision) => {
  if (!revision) return null;

  return {
    id: revision._id?.toString(),
    revisionNumber: revision.revisionNumber,
    requestedBy: buildProjectPerson(revision.requestedBy),
    requestedAt: revision.requestedAt,
    message: revision.message,
    attachments: revision.attachments || [],
    referenceLinks: revision.referenceLinks || [],
    resolved: revision.resolved,
    resolvedAt: revision.resolvedAt,
  };
};

const buildWorkspaceStudentProfile = ({
  student,
  studentProfile,
  studentVerification,
  studentProjectProfile,
  studentReviewProfile,
}) => {
  if (!student) return null;

  const skills = buildProfileSkillList(
    studentProfile?.skills,
    studentProfile?.verifiedSkills
  );
  const ratingSummary = studentReviewProfile?.ratingSummary || null;
  const completedProjectsCount =
    studentProjectProfile?.completedProjectsCount || 0;

  return {
    id: student._id?.toString(),
    name: student.fullName,
    initials: getInitials(student.fullName),
    headline: studentProfile?.education || studentProfile?.university || "",
    education: studentProfile?.education || "",
    university: studentProfile?.university || "",
    bio: studentProfile?.bio || "",
    verified: studentVerification?.status === "approved",
    skills,
    github: studentProfile?.github || "",
    linkedin: studentProfile?.linkedin || "",
    portfolio: studentProfile?.portfolio || "",
    certificates: studentProfile?.certificates || [],
    statistics: {
      averageRating: ratingSummary?.averageRating || 0,
      reviewCount: ratingSummary?.reviewCount || 0,
      ratingDistribution: ratingSummary?.ratingDistribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      completedProjectsCount,
    },
    completedProjects: studentProjectProfile?.completedProjects || [],
    latestReviews: studentReviewProfile?.latestReviews || [],
    avatarUrl: student.avatar || "",
  };
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
  revisionCount = 0,
}) => {
  const latestSubmissionSummary = latestSubmission
    ? {
        versionNumber: latestSubmission.versionNumber,
        submittedAt: latestSubmission.submittedAt,
        status: latestSubmission.status,
        demoLink: latestSubmission.demoLink || "",
        repositoryLink: latestSubmission.repositoryLink || "",
        liveUrl: latestSubmission.liveUrl || "",
      }
    : null;

  return {
    id: project._id?.toString(),
    title: project.job?.title || "",
    status: project.status,
    category: project.job?.category || "",
    description: project.job?.description || "",
    skills: project.job?.skills || [],
    student: buildProjectPerson(project.student),
    client: buildProjectPerson(project.client),
    deadline: formatCardDate(project.job?.deadline),
    budget: formatCardBudget(project.job?.budget),
    revisionCount,
    completedAt: project.completedAt,
    lastUpdated: project.lastActivityAt,
    currentAction: getCurrentAction(
      project.status,
      viewerRole,
      latestSubmission
    ),
    submissions: latestSubmissionSummary ? [latestSubmissionSummary] : [],
  };
};

export const buildProjectWorkspace = ({
  project,
  viewerRole,
  partnerProfile,
  partnerVerification,
  studentProjectProfile,
  studentReviewProfile,
  hasReview = false,
}) => {
  const partner = viewerRole === "student" ? project.client : project.student;
  const partnerRole = viewerRole === "student" ? "client" : "student";

  // Partner details are role-aware because students see clients and clients see students.
  const projectSummary = {
    ...buildProjectStatus(project),
    hasReview,
  };

  const partnerSummary = partner
    ? {
        id: partner._id?.toString(),
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
          id: project.job._id?.toString(),
          title: project.job.title,
          category: project.job.category,
          status: project.job.status,
          description: project.job.description,
          requirements: project.job.requirements,
          skills: project.job.skills || [],
          budget: project.job.budget,
          duration: project.job.duration,
          deadline: project.job.deadline,
          complexity: project.job.complexity,
          postedAt: project.job.createdAt,
          attachedFiles: project.job.attachments || [],
          ...(viewerRole === "student" && project.client
            ? {
                clientName: project.client.fullName,
                clientId: project.client._id?.toString(),
                clientInitials: getInitials(project.client.fullName),
                clientAvatar: project.client.avatar || "",
                clientLocation: partnerProfile?.location || "",
                clientCompanyName: partnerProfile?.companyName || "",
                clientWebsite: partnerProfile?.website || "",
                clientAbout: partnerProfile?.bio || "",
                clientVerified:
                  partnerProfile?.verification?.status === "approved",
                clientJobsPosted: partnerProfile?.statistics?.jobsPosted,
                clientProjectsCompleted:
                  partnerProfile?.statistics?.projectsCompleted,
                clientJoinedDate: partnerProfile?.joined,
                clientRating: partnerProfile?.statistics?.averageRating,
              }
            : {}),
        }
      : null,
    application: project.application
      ? {
          id: project.application._id?.toString(),
          status: project.application.status,
          coverMessage: project.application.coverMessage,
          estimatedTime: project.application.estimatedCompletionTime,
          whySuitable: project.application.whySuitable,
          attachments: project.application.attachments || [],
          appliedAt: project.application.appliedAt,
          acceptedAt: project.application.acceptedAt,
          rejectedAt: project.application.rejectedAt,
          withdrawnAt: project.application.withdrawnAt,
          updatedAt: project.application.updatedAt,
        }
      : null,
    studentProfile:
      viewerRole === "client"
        ? buildWorkspaceStudentProfile({
            student: project.student,
            studentProfile: partnerProfile,
            studentVerification: partnerVerification,
            studentProjectProfile,
            studentReviewProfile,
          })
        : null,
  };
};

const buildRelatedRevisionSummary = (revision) => {
  if (!revision) return null;

  return {
    id: revision._id?.toString(),
    revisionNumber: revision.revisionNumber,
    requestedAt: revision.requestedAt,
    resolved: revision.resolved,
    resolvedAt: revision.resolvedAt,
  };
};

export const buildDeliverablesSummary = ({
  project,
  currentDeliverable,
  historyDeliverables = [],
  relatedRevision,
  currentOpenRevision,
}) => {
  const currentDeliverableSummary = buildDetailedSubmission(currentDeliverable);

  if (currentDeliverableSummary) {
    currentDeliverableSummary.relatedRevision =
      buildRelatedRevisionSummary(relatedRevision);
  }

  return {
    project: {
      id: project._id?.toString(),
      status: project.status,
      canSubmit: SUBMITTABLE_PROJECT_STATUSES.includes(project.status),
    },
    currentDeliverable: currentDeliverableSummary,
    history: historyDeliverables.map(buildSubmissionHistoryItem),
    currentRevisionRequest: buildRevisionRequest(currentOpenRevision),
  };
};

export const buildApproveDeliverableResponse = ({ project }) => ({
  project: {
    id: project._id?.toString(),
    status: project.status,
    completedAt: project.completedAt,
    lastActivityAt: project.lastActivityAt,
  },
});

export const buildRequestRevisionResponse = ({
  project,
  revision,
  requestedBy,
}) => {
  const revisionObject =
    typeof revision.toObject === "function" ? revision.toObject() : revision;

  return {
    project: {
      id: project._id?.toString(),
      status: project.status,
      lastActivityAt: project.lastActivityAt,
    },
    revision: buildRevisionRequest({
      ...revisionObject,
      requestedBy: requestedBy || revisionObject.requestedBy,
    }),
  };
};

export const buildRevisionSummary = ({
  project,
  currentOpenRevision,
  revisions,
}) => ({
  project: {
    id: project._id?.toString(),
    status: project.status,
    hasOpenRevision: Boolean(currentOpenRevision),
  },
  currentOpenRevision: buildRevisionRequest(currentOpenRevision),
  revisionHistory: revisions.map((revision) => ({
    id: revision._id?.toString(),
    revisionNumber: revision.revisionNumber,
    requestedAt: revision.requestedAt,
    resolved: revision.resolved,
    resolvedAt: revision.resolvedAt,
  })),
});

const buildTimelineActor = (actor) => {
  if (!actor) return null;

  if (typeof actor !== "object") {
    return {
      id: actor.toString(),
    };
  }

  return {
    id: actor._id?.toString() || actor.id?.toString(),
    fullName: actor.fullName || "",
    avatar: actor.avatar || "",
  };
};

export const buildProjectTimeline = ({ timeline }) => ({
  timeline: [...(timeline || [])]
    .sort((firstEvent, secondEvent) => {
      const firstCreatedAt = new Date(firstEvent.createdAt).getTime();
      const secondCreatedAt = new Date(secondEvent.createdAt).getTime();

      return secondCreatedAt - firstCreatedAt;
    })
    .map((event) => {
      const createdAt = event.createdAt;
      const timelineEvent = {
        type: event.type,
        message: event.message,
        actor: buildTimelineActor(event.actor),
        createdAt,
      };

      if (event.referenceType) {
        timelineEvent.referenceType = event.referenceType;
      }

      if (event.referenceId) {
        timelineEvent.referenceId = event.referenceId.toString();
      }

      return timelineEvent;
    }),
});

export const buildSubmitDeliverableResponse = ({ project, deliverable }) => ({
  project: buildProjectStatus(project),
  latestSubmission: buildDetailedSubmission(deliverable),
});
