import mongoose from "mongoose";
import { ClientProfile } from "../models/clientProfile.model.js";
import { Deliverable } from "../models/deliverable.model.js";
import { Project } from "../models/project.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  buildProjectSummary,
  buildProjectWorkspace,
} from "../utils/projectResponse.js";

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

export { getMyProjects, getProjectById };
