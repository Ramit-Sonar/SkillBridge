import { Deliverable } from "../models/deliverable.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildProjectSummary } from "../utils/projectResponse.js";

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

export { getMyProjects };
