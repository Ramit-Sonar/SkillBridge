import mongoose from "mongoose";
import validator from "validator";
import { ClientProfile } from "../models/clientProfile.model.js";
import { Deliverable } from "../models/deliverable.model.js";
import { Project } from "../models/project.model.js";
import { Revision } from "../models/revision.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { Verification } from "../models/verification.model.js";
import {
  appendTimeline,
  getLatestDeliverable,
  getOpenRevision,
  updateProjectActivity,
} from "../services/project.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteAttachments, uploadAttachments } from "../utils/attachment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  buildApproveDeliverableResponse,
  buildDeliverablesSummary,
  buildProjectSummary,
  buildProjectTimeline,
  buildProjectWorkspace,
  buildRequestRevisionResponse,
  buildRevisionSummary,
  buildSubmitDeliverableResponse,
} from "../utils/projectResponse.js";
import { removeTempFiles } from "../utils/tempFile.js";

const SUBMITTABLE_PROJECT_STATUSES = ["active", "revision_requested"];

const validateOptionalUrl = (value, fieldName) => {
  if (value === undefined || value === null) return "";

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a valid URL`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) return "";

  if (
    !validator.isURL(trimmedValue, {
      protocols: ["http", "https"],
      require_protocol: true,
    })
  ) {
    throw new ApiError(400, `${fieldName} must be a valid URL`);
  }

  return trimmedValue;
};

const normalizeReferenceLinks = (referenceLinks) => {
  if (referenceLinks === undefined || referenceLinks === null) return [];

  let links = referenceLinks;

  if (typeof referenceLinks === "string") {
    const trimmedLinks = referenceLinks.trim();

    if (!trimmedLinks) return [];

    if (trimmedLinks.startsWith("[")) {
      try {
        links = JSON.parse(trimmedLinks);
      } catch {
        throw new ApiError(400, "Reference links must be valid URLs");
      }
    } else {
      links = trimmedLinks.split(/\r?\n|,/);
    }
  }

  if (!Array.isArray(links)) {
    throw new ApiError(400, "Reference links must be valid URLs");
  }

  return links
    .map((link) => {
      if (typeof link !== "string") {
        throw new ApiError(400, "Reference links must be valid URLs");
      }

      const trimmedLink = link.trim();

      if (!trimmedLink) return null;

      if (
        !validator.isURL(trimmedLink, {
          protocols: ["http", "https"],
          require_protocol: true,
        })
      ) {
        throw new ApiError(400, "Reference links must be valid URLs");
      }

      return trimmedLink;
    })
    .filter(Boolean);
};

const getLatestDeliverableMap = async (projectIds) => {
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
        versionNumber: { $first: "$versionNumber" },
        submittedAt: { $first: "$submittedAt" },
        status: { $first: "$status" },
      },
    },
  ]);

  return new Map(
    latestDeliverables.map((deliverable) => [
      deliverable._id.toString(),
      {
        versionNumber: deliverable.versionNumber,
        submittedAt: deliverable.submittedAt,
        status: deliverable.status,
      },
    ])
  );
};

const getMyProjects = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!["student", "client"].includes(req.user.role)) {
    throw new ApiError(
      403,
      "Only students and clients can view their projects"
    );
  }

  const ownerField = req.user.role === "student" ? "student" : "client";
  const partnerField = req.user.role === "student" ? "client" : "student";

  const projects = await Project.find({ [ownerField]: req.user._id })
    .select(
      "_id job student client status startedAt completedAt lastActivityAt"
    )
    .populate({
      path: "job",
      select: "_id title category budget deadline",
    })
    .populate({
      path: partnerField,
      select: "_id fullName avatar",
    })
    .sort({ lastActivityAt: -1 })
    .lean();

  const projectIds = projects.map((project) => project._id);
  const latestDeliverableMap = await getLatestDeliverableMap(projectIds);

  const projectSummaries = projects.map((project) =>
    buildProjectSummary({
      project,
      viewerRole: req.user.role,
      latestSubmission:
        latestDeliverableMap.get(project._id.toString()) || null,
    })
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalProjects: projectSummaries.length,
        projects: projectSummaries,
      },
      "Projects fetched successfully"
    )
  );
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!["student", "client"].includes(req.user.role)) {
    throw new ApiError(403, "Only students and clients can view projects");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId)
    .select(
      "job application student client status startedAt completedAt lastActivityAt"
    )
    .populate({
      path: "job",
      select: "_id title category budget deadline verificationRequirement",
    })
    .populate({
      path: "application",
      select:
        "_id coverMessage estimatedCompletionTime whySuitable attachments appliedAt",
    })
    .populate({
      path: "student",
      select: "_id fullName avatar",
    })
    .populate({
      path: "client",
      select: "_id fullName avatar",
    })
    .lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const userId = req.user._id.toString();
  const studentId = project.student?._id?.toString();
  const clientId = project.client?._id?.toString();

  if (req.user.role === "student" && studentId !== userId) {
    throw new ApiError(403, "You can view only your own projects");
  }

  if (req.user.role === "client" && clientId !== userId) {
    throw new ApiError(403, "You can view only your own projects");
  }

  let partnerProfile = null;
  let partnerVerification = null;

  if (req.user.role === "student" && clientId) {
    partnerProfile = await ClientProfile.findOne({ user: clientId })
      .select("companyName")
      .lean();
  }

  if (req.user.role === "client" && studentId) {
    [partnerProfile, partnerVerification] = await Promise.all([
      StudentProfile.findOne({ user: studentId })
        .select("education university")
        .lean(),
      Verification.findOne({ user: studentId, type: "student" })
        .select("status")
        .lean(),
    ]);
  }

  const projectWorkspace = buildProjectWorkspace({
    project,
    viewerRole: req.user.role,
    partnerProfile,
    partnerVerification,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, projectWorkspace, "Project fetched successfully")
    );
});

const getProjectDeliverables = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!["student", "client"].includes(req.user.role)) {
    throw new ApiError(403, "Only students and clients can view deliverables");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId)
    .select("student client status")
    .lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const userId = req.user._id.toString();

  if (req.user.role === "student" && project.student.toString() !== userId) {
    throw new ApiError(403, "You can view only your own project deliverables");
  }

  if (req.user.role === "client" && project.client.toString() !== userId) {
    throw new ApiError(403, "You can view only your own project deliverables");
  }

  const deliverables = await Deliverable.find({ project: project._id })
    .select(
      "_id versionNumber notes demoLink repositoryLink liveUrl attachments submittedAt submittedBy status approvedAt"
    )
    .sort({ versionNumber: -1 })
    .lean();

  const deliverablesSummary = buildDeliverablesSummary({
    project,
    deliverables,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deliverablesSummary,
        "Project deliverables fetched successfully"
      )
    );
});

const getProjectRevisions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!["student", "client"].includes(req.user.role)) {
    throw new ApiError(403, "Only students and clients can view revisions");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId)
    .select("student client status")
    .lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const userId = req.user._id.toString();

  if (req.user.role === "student" && project.student.toString() !== userId) {
    throw new ApiError(403, "You can view only your own project revisions");
  }

  if (req.user.role === "client" && project.client.toString() !== userId) {
    throw new ApiError(403, "You can view only your own project revisions");
  }

  const [currentOpenRevision, revisions] = await Promise.all([
    Revision.findOne({
      project: project._id,
      resolved: false,
    })
      .select(
        "_id revisionNumber message attachments referenceLinks requestedAt requestedBy resolved resolvedAt"
      )
      .sort({ revisionNumber: -1 })
      .lean(),
    Revision.find({ project: project._id })
      .select("_id revisionNumber requestedAt resolved resolvedAt")
      .sort({ revisionNumber: -1 })
      .lean(),
  ]);

  const revisionSummary = buildRevisionSummary({
    project,
    currentOpenRevision,
    revisions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        revisionSummary,
        "Project revisions fetched successfully"
      )
    );
});

const getProjectTimeline = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!["student", "client"].includes(req.user.role)) {
    throw new ApiError(403, "Only students and clients can view timeline");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId)
    .select("student client timeline")
    .populate({
      path: "timeline.actor",
      select: "fullName avatar",
    })
    .lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const userId = req.user._id.toString();

  if (req.user.role === "student" && project.student.toString() !== userId) {
    throw new ApiError(403, "You can view only your own project timeline");
  }

  if (req.user.role === "client" && project.client.toString() !== userId) {
    throw new ApiError(403, "You can view only your own project timeline");
  }

  const projectTimeline = buildProjectTimeline({
    timeline: project.timeline,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectTimeline,
        "Project timeline fetched successfully"
      )
    );
});

const approveDeliverable = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  let session;

  try {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (req.user.role !== "client") {
      throw new ApiError(403, "Only clients can approve deliverables");
    }

    if (!mongoose.isValidObjectId(projectId)) {
      throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId)
      .select("client status")
      .lean();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.client.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can approve only your own project");
    }

    if (project.status !== "submitted") {
      if (project.status === "completed") {
        throw new ApiError(400, "Completed projects cannot be approved again");
      }

      throw new ApiError(400, "Project is not awaiting deliverable approval");
    }

    session = await mongoose.startSession();
    let responseData;

    await session.withTransaction(async () => {
      const currentProject = await Project.findById(projectId)
        .select("client status startedAt completedAt lastActivityAt timeline")
        .session(session);

      if (!currentProject) {
        throw new ApiError(404, "Project not found");
      }

      if (currentProject.client.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can approve only your own project");
      }

      if (currentProject.status !== "submitted") {
        if (currentProject.status === "completed") {
          throw new ApiError(
            400,
            "Completed projects cannot be approved again"
          );
        }

        throw new ApiError(400, "Project is not awaiting deliverable approval");
      }

      const latestDeliverable = await getLatestDeliverable(
        currentProject._id,
        session,
        "status versionNumber approvedBy approvedAt"
      );

      if (!latestDeliverable) {
        throw new ApiError(400, "Latest deliverable not found");
      }

      if (latestDeliverable.status !== "submitted") {
        throw new ApiError(400, "Latest deliverable is not awaiting approval");
      }

      const approvedAt = new Date();

      latestDeliverable.set({
        status: "approved",
        approvedBy: req.user._id,
        approvedAt,
      });

      await latestDeliverable.save({ session });

      let updatedProject = await updateProjectActivity(
        currentProject,
        {
          status: "completed",
          completedAt: approvedAt,
          lastActivityAt: approvedAt,
        },
        session
      );

      updatedProject = await appendTimeline(
        updatedProject,
        {
          type: "deliverable_approved",
          actor: req.user._id,
          message: `Client approved Deliverable Version ${latestDeliverable.versionNumber}.`,
          createdAt: approvedAt,
        },
        session
      );

      updatedProject = await appendTimeline(
        updatedProject,
        {
          type: "project_completed",
          actor: req.user._id,
          message: "Project completed successfully.",
          createdAt: approvedAt,
        },
        session
      );

      responseData = buildApproveDeliverableResponse({
        project: updatedProject,
      });
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, responseData, "Deliverable approved successfully")
      );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

const requestRevision = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files;
  const { projectId } = req.params;
  const { message, referenceLinks } = req.body || {};
  let uploadedAttachments = [];
  let session;

  try {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (req.user.role !== "client") {
      throw new ApiError(403, "Only clients can request revisions");
    }

    if (!mongoose.isValidObjectId(projectId)) {
      throw new ApiError(400, "Invalid project id");
    }

    if (typeof message !== "string" || !message.trim()) {
      throw new ApiError(400, "Revision message is required");
    }

    const trimmedMessage = message.trim();
    const normalizedReferenceLinks = normalizeReferenceLinks(referenceLinks);

    const project = await Project.findById(projectId)
      .select("client status")
      .lean();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.client.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "You can request revisions only for your own project"
      );
    }

    if (project.status !== "submitted") {
      if (project.status === "completed") {
        throw new ApiError(
          400,
          "Completed projects cannot receive revision requests"
        );
      }

      throw new ApiError(400, "Project is not awaiting revision review");
    }

    uploadedAttachments = await uploadAttachments(uploadedFiles);
    session = await mongoose.startSession();
    let responseData;

    await session.withTransaction(async () => {
      const currentProject = await Project.findById(projectId)
        .select("client status startedAt completedAt lastActivityAt timeline")
        .session(session);

      if (!currentProject) {
        throw new ApiError(404, "Project not found");
      }

      if (currentProject.client.toString() !== req.user._id.toString()) {
        throw new ApiError(
          403,
          "You can request revisions only for your own project"
        );
      }

      if (currentProject.status !== "submitted") {
        if (currentProject.status === "completed") {
          throw new ApiError(
            400,
            "Completed projects cannot receive revision requests"
          );
        }

        throw new ApiError(400, "Project is not awaiting revision review");
      }

      const latestDeliverable = await getLatestDeliverable(
        currentProject._id,
        session,
        "status versionNumber"
      );

      if (!latestDeliverable) {
        throw new ApiError(400, "Latest deliverable not found");
      }

      if (latestDeliverable.status !== "submitted") {
        throw new ApiError(400, "Latest deliverable is not awaiting review");
      }

      const latestRevision = await Revision.findOne({
        project: currentProject._id,
      })
        .select("revisionNumber")
        .sort({ revisionNumber: -1 })
        .session(session)
        .lean();
      const nextRevisionNumber = (latestRevision?.revisionNumber || 0) + 1;
      const requestedAt = new Date();

      const [revision] = await Revision.create(
        [
          {
            project: currentProject._id,
            deliverable: latestDeliverable._id,
            revisionNumber: nextRevisionNumber,
            requestedBy: req.user._id,
            requestedAt,
            message: trimmedMessage,
            attachments: uploadedAttachments,
            referenceLinks: normalizedReferenceLinks,
          },
        ],
        { session }
      );

      let updatedProject = await updateProjectActivity(
        currentProject,
        {
          status: "revision_requested",
          lastActivityAt: requestedAt,
        },
        session
      );

      updatedProject = await appendTimeline(
        updatedProject,
        {
          type: "revision_requested",
          actor: req.user._id,
          message: `Revision requested for Version ${latestDeliverable.versionNumber}.`,
          createdAt: requestedAt,
        },
        session
      );

      responseData = buildRequestRevisionResponse({
        project: updatedProject,
        revision,
      });
    });

    uploadedAttachments = [];

    return res
      .status(201)
      .json(
        new ApiResponse(201, responseData, "Revision requested successfully")
      );
  } catch (error) {
    await deleteAttachments(uploadedAttachments);

    if (error?.code === 11000) {
      throw new ApiError(409, "Revision request already exists");
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }

    removeTempFiles(uploadedFiles);
  }
});

const submitDeliverable = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files;
  const { projectId } = req.params;
  const { notes, demoLink, repositoryLink, liveUrl } = req.body || {};
  let uploadedAttachments = [];
  let session;

  try {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (req.user.role !== "student") {
      throw new ApiError(403, "Only students can submit deliverables");
    }

    if (!mongoose.isValidObjectId(projectId)) {
      throw new ApiError(400, "Invalid project id");
    }

    if (typeof notes !== "string" || !notes.trim()) {
      throw new ApiError(400, "Submission notes are required");
    }

    const trimmedNotes = notes.trim();
    const trimmedDemoLink = validateOptionalUrl(demoLink, "Demo link");
    const trimmedRepositoryLink = validateOptionalUrl(
      repositoryLink,
      "Repository link"
    );
    const trimmedLiveUrl = validateOptionalUrl(liveUrl, "Live URL");

    const project = await Project.findById(projectId)
      .select("student status")
      .lean();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.student.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can submit only for your own project");
    }

    if (!SUBMITTABLE_PROJECT_STATUSES.includes(project.status)) {
      if (project.status === "submitted") {
        throw new ApiError(
          400,
          "This project is already submitted and awaiting client review"
        );
      }

      if (project.status === "completed") {
        throw new ApiError(400, "Completed projects cannot be submitted again");
      }

      throw new ApiError(400, "Project is not open for deliverable submission");
    }

    uploadedAttachments = await uploadAttachments(uploadedFiles);
    session = await mongoose.startSession();
    let responseData;

    await session.withTransaction(async () => {
      const currentProject = await Project.findById(projectId)
        .select("student status startedAt completedAt lastActivityAt timeline")
        .session(session);

      if (!currentProject) {
        throw new ApiError(404, "Project not found");
      }

      if (currentProject.student.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can submit only for your own project");
      }

      if (!SUBMITTABLE_PROJECT_STATUSES.includes(currentProject.status)) {
        if (currentProject.status === "submitted") {
          throw new ApiError(
            400,
            "This project is already submitted and awaiting client review"
          );
        }

        if (currentProject.status === "completed") {
          throw new ApiError(
            400,
            "Completed projects cannot be submitted again"
          );
        }

        throw new ApiError(
          400,
          "Project is not open for deliverable submission"
        );
      }

      const latestDeliverable = await getLatestDeliverable(
        currentProject._id,
        session
      );
      const nextVersionNumber = (latestDeliverable?.versionNumber || 0) + 1;
      const submittedAt = new Date();
      const isResubmission = currentProject.status === "revision_requested";
      const [deliverable] = await Deliverable.create(
        [
          {
            project: currentProject._id,
            versionNumber: nextVersionNumber,
            submittedBy: req.user._id,
            submittedAt,
            notes: trimmedNotes,
            demoLink: trimmedDemoLink,
            repositoryLink: trimmedRepositoryLink,
            liveUrl: trimmedLiveUrl,
            attachments: uploadedAttachments,
            status: "submitted",
          },
        ],
        { session }
      );

      if (isResubmission) {
        const resolvedRevision = await getOpenRevision(
          currentProject._id,
          session
        );

        if (!resolvedRevision) {
          throw new ApiError(400, "Open revision request not found");
        }

        resolvedRevision.set({
          resolved: true,
          resolvedAt: submittedAt,
          resolvedByDeliverable: deliverable._id,
        });

        await resolvedRevision.save({ session });
      }

      const timelineType = isResubmission
        ? "deliverable_resubmitted"
        : "deliverable_submitted";
      const timelineMessage = isResubmission
        ? `Student resubmitted Version ${nextVersionNumber} after requested revisions.`
        : `Student submitted Version ${nextVersionNumber}.`;
      await appendTimeline(
        currentProject,
        {
          type: timelineType,
          actor: req.user._id,
          message: timelineMessage,
          createdAt: submittedAt,
        },
        session
      );

      const updatedProject = await updateProjectActivity(
        currentProject,
        {
          status: "submitted",
          lastActivityAt: submittedAt,
        },
        session
      );

      responseData = buildSubmitDeliverableResponse({
        project: updatedProject,
        deliverable,
      });
    });

    uploadedAttachments = [];

    return res
      .status(201)
      .json(
        new ApiResponse(201, responseData, "Deliverable submitted successfully")
      );
  } catch (error) {
    await deleteAttachments(uploadedAttachments);

    if (error?.code === 11000) {
      throw new ApiError(409, "Deliverable version already exists");
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }

    removeTempFiles(uploadedFiles);
  }
});

export {
  approveDeliverable,
  getMyProjects,
  getProjectById,
  getProjectDeliverables,
  getProjectRevisions,
  getProjectTimeline,
  requestRevision,
  submitDeliverable,
};
