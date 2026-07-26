import { Project } from "../models/project.model.js";
import { Deliverable } from "../models/deliverable.model.js";
import { Job } from "../models/job.model.js";
import { Revision } from "../models/revision.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { ApiError } from "../utils/ApiError.js";

const PROJECT_CREATED_MESSAGE = "Project created after application acceptance.";
export const SKILL_VERIFICATION_THRESHOLD = 1;

const getDocumentId = (document) => document?._id || document;
const normalizeSkillName = (skill = "") => skill.trim().toLowerCase();

export const buildProfileSkillList = (skills = [], verifiedSkills = []) => {
  const verifiedSet = new Set(
    (verifiedSkills || []).map(normalizeSkillName).filter(Boolean)
  );

  return (skills || [])
    .map((skill) => {
      if (typeof skill === "string") {
        return {
          name: skill,
          verified: verifiedSet.has(normalizeSkillName(skill)),
        };
      }

      return {
        name: skill?.name || "",
        verified:
          Boolean(skill?.verified) ||
          verifiedSet.has(normalizeSkillName(skill?.name || "")),
      };
    })
    .filter((skill) => skill.name);
};

/**
 * Returns the latest deliverable for project state transitions and summaries.
 */
export const getLatestDeliverable = async (
  projectId,
  session = null,
  selectFields = ""
) => {
  const query = Deliverable.findOne({ project: projectId }).sort({
    versionNumber: -1,
  });

  if (selectFields) {
    query.select(selectFields);
  }

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

export const verifyStudentSkillsForCompletedProject = async ({
  project,
  session = null,
}) => {
  if (!project?.student || !project?.job) return [];

  const profileQuery = StudentProfile.findOne({ user: project.student });
  const jobQuery = Job.findById(project.job).select("skills").lean();

  if (session) {
    profileQuery.session(session);
    jobQuery.session(session);
  }

  const [studentProfile, currentJob] = await Promise.all([
    profileQuery,
    jobQuery,
  ]);

  if (!studentProfile || !currentJob?.skills?.length) return [];

  const currentJobSkillSet = new Set(
    currentJob.skills.map(normalizeSkillName).filter(Boolean)
  );
  const verifiedSkillSet = new Set(
    (studentProfile.verifiedSkills || [])
      .map(normalizeSkillName)
      .filter(Boolean)
  );

  const eligibleSkills = (studentProfile.skills || [])
    .map((skill) => ({
      name: skill,
      normalized: normalizeSkillName(skill),
    }))
    .filter(
      (skill) =>
        skill.normalized &&
        currentJobSkillSet.has(skill.normalized) &&
        !verifiedSkillSet.has(skill.normalized)
    );

  if (eligibleSkills.length === 0) return [];

  const completedProjectsQuery = Project.find({
    student: project.student,
    status: "completed",
  })
    .select("job")
    .populate({
      path: "job",
      select: "skills",
    })
    .lean();

  if (session) {
    completedProjectsQuery.session(session);
  }

  const completedProjects = await completedProjectsQuery;
  const completedCountBySkill = new Map(
    eligibleSkills.map((skill) => [skill.normalized, 0])
  );

  completedProjects.forEach((completedProject) => {
    const completedJobSkillSet = new Set(
      (completedProject.job?.skills || [])
        .map(normalizeSkillName)
        .filter(Boolean)
    );

    eligibleSkills.forEach((skill) => {
      if (completedJobSkillSet.has(skill.normalized)) {
        completedCountBySkill.set(
          skill.normalized,
          completedCountBySkill.get(skill.normalized) + 1
        );
      }
    });
  });

  const newlyVerifiedSkills = eligibleSkills
    .filter(
      (skill) =>
        completedCountBySkill.get(skill.normalized) >=
        SKILL_VERIFICATION_THRESHOLD
    )
    .map((skill) => skill.name);

  if (newlyVerifiedSkills.length === 0) return [];

  studentProfile.verifiedSkills = [
    ...(studentProfile.verifiedSkills || []),
    ...newlyVerifiedSkills,
  ];

  await studentProfile.save(session ? { session } : {});

  return newlyVerifiedSkills;
};

const buildLatestDeliverableMap = async (projectIds) => {
  if (projectIds.length === 0) return new Map();

  const latestDeliverables = await Deliverable.aggregate([
    {
      $match: {
        project: { $in: projectIds },
      },
    },
    {
      $sort: {
        project: 1,
        submittedAt: -1,
        versionNumber: -1,
      },
    },
    {
      $group: {
        _id: "$project",
        deliverableId: { $first: "$_id" },
        versionNumber: { $first: "$versionNumber" },
        submittedAt: { $first: "$submittedAt" },
        status: { $first: "$status" },
        demoLink: { $first: "$demoLink" },
        repositoryLink: { $first: "$repositoryLink" },
        liveUrl: { $first: "$liveUrl" },
      },
    },
  ]);

  return new Map(
    latestDeliverables.map((deliverable) => [
      deliverable._id.toString(),
      {
        id: deliverable.deliverableId?.toString(),
        versionNumber: deliverable.versionNumber,
        submittedAt: deliverable.submittedAt,
        status: deliverable.status,
        demoLink: deliverable.demoLink || "",
        repositoryLink: deliverable.repositoryLink || "",
        liveUrl: deliverable.liveUrl || "",
      },
    ])
  );
};

export const getStudentCompletedProjectProfileMap = async (
  studentIds,
  projectLimit = Infinity
) => {
  const validStudentIds = [
    ...new Set(studentIds.map((id) => id?.toString()).filter(Boolean)),
  ];

  if (validStudentIds.length === 0) return new Map();

  // Build profile metrics in one pass so applicant/public profile pages avoid per-student queries.
  const completedProjects = await Project.find({
    student: { $in: validStudentIds },
    status: "completed",
  })
    .select("_id student client job status completedAt lastActivityAt")
    .populate({
      path: "client",
      select: "_id fullName avatar",
    })
    .populate({
      path: "job",
      select: "_id title category description skills",
    })
    .sort({ completedAt: -1, lastActivityAt: -1 })
    .lean();

  const latestDeliverableMap = await buildLatestDeliverableMap(
    completedProjects.map((project) => project._id)
  );

  const profileMap = new Map(
    validStudentIds.map((studentId) => [
      studentId,
      {
        completedProjectsCount: 0,
        completedProjects: [],
      },
    ])
  );

  completedProjects.forEach((project) => {
    const studentId = project.student?.toString();
    const profile = profileMap.get(studentId);

    if (!profile) return;

    profile.completedProjectsCount += 1;

    if (profile.completedProjects.length >= projectLimit) return;

    profile.completedProjects.push({
      projectId: project._id?.toString(),
      status: project.status,
      completedAt: project.completedAt,
      job: project.job
        ? {
            jobId: project.job._id?.toString(),
            title: project.job.title,
            category: project.job.category,
            description: project.job.description,
            skills: project.job.skills || [],
          }
        : null,
      client: project.client
        ? {
            clientId: project.client._id?.toString(),
            fullName: project.client.fullName,
            avatar: project.client.avatar || "",
          }
        : null,
      latestSubmission:
        latestDeliverableMap.get(project._id.toString()) || null,
    });
  });

  return profileMap;
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
    throw new ApiError(
      500,
      "Project creation requires an active database session"
    );
  }

  if (!application) {
    throw new ApiError(
      400,
      "Accepted application is required to create project"
    );
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
    throw new ApiError(
      400,
      "Application and job must include project relationships"
    );
  }

  // Enforce one project per accepted application/job even inside the transaction.
  const existingApplicationProject = await Project.exists({
    application: applicationId,
  }).session(session);

  if (existingApplicationProject) {
    throw new ApiError(409, "Application is already linked to a project");
  }

  const existingJobProject = await Project.exists({ job: jobId }).session(
    session
  );

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
      throw new ApiError(
        409,
        "Project already exists for this application or job"
      );
    }

    throw error;
  }
};
