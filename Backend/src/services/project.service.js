import { Project } from "../models/project.model.js";
import { Deliverable } from "../models/deliverable.model.js";
import { Revision } from "../models/revision.model.js";
import { ApiError } from "../utils/ApiError.js";

const PROJECT_CREATED_MESSAGE = "Project created after application acceptance.";

const getDocumentId = (document) => document?._id || document;

export const getLatestDeliverable = async (projectId, session = null) => {
  const query = Deliverable.findOne({ project: projectId }).sort({
    versionNumber: -1,
  });

  if (session) {
    query.session(session);
  }

  return query;
};

export const getOpenRevision = async (projectId, session = null) => {
  const query = Revision.findOne({
    project: projectId,
    resolved: false,
  }).sort({ revisionNumber: -1 });

  if (session) {
    query.session(session);
  }

  return query;
};

export const appendTimeline = async (project, event, session = null) => {
  project.timeline.push({
    ...event,
    createdAt: event.createdAt || new Date(),
  });

  return project.save(session ? { session } : {});
};

export const updateProjectActivity = async (
  project,
  updates = {},
  session = null
) => {
  project.set({
    ...updates,
    lastActivityAt: updates.lastActivityAt || new Date(),
  });

  return project.save(session ? { session } : {});
};

export const createProjectFromAcceptedApplication = async ({
  application,
  job,
  session,
}) => {
  if (!session) {
    throw new ApiError(500, "Project creation requires an active database session");
  }

  if (!application) {
    throw new ApiError(400, "Accepted application is required to create project");
  }

  if (!job) {
    throw new ApiError(400, "Associated job is required to create project");
  }

  if (application.status !== "accepted") {
    throw new ApiError(400, "Only accepted applications can create a project");
  }

  const applicationId = getDocumentId(application);
  const jobId = getDocumentId(job);
  const studentId = getDocumentId(application.student);
  const clientId = getDocumentId(job.client);

  if (!applicationId || !jobId || !studentId || !clientId) {
    throw new ApiError(400, "Application and job must include project relationships");
  }

  const existingApplicationProject = await Project.exists({
    application: applicationId,
  }).session(session);

  if (existingApplicationProject) {
    throw new ApiError(409, "Application is already linked to a project");
  }

  const existingJobProject = await Project.exists({ job: jobId }).session(session);

  if (existingJobProject) {
    throw new ApiError(409, "Job is already linked to a project");
  }

  const startedAt = application.acceptedAt || new Date();

  try {
    const [project] = await Project.create(
      [
        {
          job: jobId,
          application: applicationId,
          student: studentId,
          client: clientId,
          status: "active",
          startedAt,
          lastActivityAt: startedAt,
          timeline: [
            {
              type: "project_created",
              actor: clientId,
              message: PROJECT_CREATED_MESSAGE,
              createdAt: startedAt,
            },
          ],
        },
      ],
      { session }
    );

    return project;
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "Project already exists for this application or job");
    }

    throw error;
  }
};
