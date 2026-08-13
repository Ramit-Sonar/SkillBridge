import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Project } from "../models/project.model.js";
import { Verification } from "../models/verification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  normalizeSubmittedAttachments,
  uploadAttachments as uploadJobAttachments,
} from "../utils/attachment.js";
import { buildClientSummary } from "../services/client.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeTempFiles } from "../utils/tempFile.js";

/*
 * Handles job posting, browsing, updates, and cancellation.
 * Public job responses expose only safe client details.
 */
const VALID_JOB_CATEGORIES = [
  "web-dev",
  "ui-ux",
  "graphic",
  "documentation",
  "presentation",
  "other",
];

const VALID_JOB_DURATIONS = ["1d", "3d", "5d", "7d", "14d"];
const MIN_JOB_BUDGET = 500;
const MAX_JOB_BUDGET = 100000;

const parseSkills = (skills) => {
  if (skills === undefined) return undefined;
  if (Array.isArray(skills)) return skills;

  if (typeof skills === "string") {
    try {
      const parsedSkills = JSON.parse(skills);
      return Array.isArray(parsedSkills) ? parsedSkills : undefined;
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
};

const toPublicClient = (client, verificationStatus = null) => {
  if (!client) return null;

  return {
    fullName: client.fullName,
    avatar: client.avatar,
    verification: {
      status: verificationStatus,
    },
  };
};

const getClientVerificationMap = async (clientIds) => {
  const uniqueClientIds = [...new Set(clientIds.filter(Boolean).map(String))];

  if (uniqueClientIds.length === 0) return new Map();

  const verifications = await Verification.find({
    user: { $in: uniqueClientIds },
    type: "client",
  })
    .select("user status")
    .lean();

  return new Map(
    verifications.map((verification) => [
      verification.user.toString(),
      verification.status,
    ])
  );
};

const createJob = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files;

  try {
    const {
      title,
      category,
      description,
      requirements,
      skills,
      budget,
      duration,
      deadline,
      complexity,
      files,
    } = req.body || {};

    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (req.user.role !== "client") {
      throw new ApiError(403, "Only clients can create jobs");
    }

    if (!title?.trim()) {
      throw new ApiError(400, "Job title is required");
    }

    if (!category?.trim()) {
      throw new ApiError(400, "Category is required");
    }

    if (!VALID_JOB_CATEGORIES.includes(category.trim())) {
      throw new ApiError(400, "Category must be a valid job category");
    }

    if (!description?.trim() || description.trim().length < 20) {
      throw new ApiError(400, "Description must be at least 20 characters");
    }

    if (!requirements?.trim()) {
      throw new ApiError(400, "Client requirements are required");
    }

    if (
      budget === undefined ||
      budget === null ||
      String(budget).trim() === ""
    ) {
      throw new ApiError(400, "Budget is required");
    }

    const numericBudget = Number(budget);

    if (Number.isNaN(numericBudget)) {
      throw new ApiError(400, "Budget must be a valid amount");
    }

    if (numericBudget < MIN_JOB_BUDGET || numericBudget > MAX_JOB_BUDGET) {
      throw new ApiError(
        400,
        `Budget must be between Rs. ${MIN_JOB_BUDGET} and Rs. ${MAX_JOB_BUDGET}`
      );
    }

    if (!duration?.trim()) {
      throw new ApiError(400, "Duration is required");
    }

    if (!VALID_JOB_DURATIONS.includes(duration.trim())) {
      throw new ApiError(400, "Duration must be a valid job duration");
    }

    if (!deadline) {
      throw new ApiError(400, "Deadline is required");
    }

    const deadlineDate = new Date(deadline);

    if (Number.isNaN(deadlineDate.getTime())) {
      throw new ApiError(400, "Deadline must be a valid date");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      throw new ApiError(400, "Deadline cannot be in the past");
    }

    if (!complexity?.trim()) {
      throw new ApiError(400, "Complexity is required");
    }

    if (!["small", "medium"].includes(complexity)) {
      throw new ApiError(400, "Complexity must be small or medium");
    }

    const submittedSkills = parseSkills(skills);

    if (skills !== undefined && !Array.isArray(submittedSkills)) {
      throw new ApiError(400, "Skills must be an array");
    }

    if (files !== undefined && !Array.isArray(files)) {
      throw new ApiError(400, "Files must be an array");
    }

    const verificationMap = await getClientVerificationMap([req.user._id]);
    const verificationStatus = verificationMap.get(req.user._id.toString());

    // Only approved client verification records are allowed to create jobs.
    if (verificationStatus !== "approved") {
      throw new ApiError(
        403,
        "Profile verification is required before posting a job."
      );
    }

    const attachments = await uploadJobAttachments(req.files, files);

    const job = await Job.create({
      client: req.user._id,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      skills: submittedSkills ?? [],
      budget: numericBudget,
      duration: duration.trim(),
      deadline: deadlineDate,
      complexity,
      attachments,
      status: "open",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, job, "Job created successfully"));
  } finally {
    removeTempFiles(uploadedFiles);
  }
});

const getClientJobs = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can view their jobs");
  }

  const jobs = await Job.find({
    client: req.user._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  // Counts are aggregated separately so the job list stays compact.
  const applicationCounts = await Application.aggregate([
    {
      $match: {
        job: { $in: jobs.map((job) => job._id) },
      },
    },
    {
      $group: {
        _id: "$job",
        count: { $sum: 1 },
      },
    },
  ]);
  const pendingApplicationCounts = await Application.aggregate([
    {
      $match: {
        job: { $in: jobs.map((job) => job._id) },
        status: "pending",
      },
    },
    {
      $group: {
        _id: "$job",
        count: { $sum: 1 },
      },
    },
  ]);

  const applicationCountMap = new Map(
    applicationCounts.map((item) => [item._id.toString(), item.count])
  );
  const pendingApplicationCountMap = new Map(
    pendingApplicationCounts.map((item) => [item._id.toString(), item.count])
  );

  const jobsWithApplicationCount = jobs.map((job) => ({
    ...job,
    applicationCount: applicationCountMap.get(job._id.toString()) || 0,
    pendingApplicationCount:
      pendingApplicationCountMap.get(job._id.toString()) || 0,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        jobsWithApplicationCount,
        "Client jobs fetched successfully"
      )
    );
});

const getAllOpenJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({
    status: "open",
  })
    .select(
      "client title category description budget duration deadline skills complexity status createdAt"
    )
    .populate("client", "fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  const verificationMap = await getClientVerificationMap(
    jobs.map((job) => job.client?._id)
  );

  // Browse cards should not expose private client profile fields.
  const publicJobs = jobs.map((job) => ({
    _id: job._id,
    title: job.title,
    category: job.category,
    description: job.description,
    budget: job.budget,
    duration: job.duration,
    deadline: job.deadline,
    skills: job.skills,
    complexity: job.complexity,
    status: job.status,
    createdAt: job.createdAt,
    client: toPublicClient(
      job.client,
      verificationMap.get(job.client?._id?.toString()) ?? null
    ),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, publicJobs, "Open jobs fetched successfully"));
});

const getJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(jobId)
    .populate("client", "fullName avatar")
    .lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (!req.user) {
    if (job.status !== "open") {
      throw new ApiError(403, "You are not allowed to view this job");
    }

    const clientId = job.client?._id || job.client;
    const verificationMap = await getClientVerificationMap([clientId]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: job._id,
          title: job.title,
          category: job.category,
          description: job.description,
          budget: job.budget,
          duration: job.duration,
          deadline: job.deadline,
          skills: job.skills,
          complexity: job.complexity,
          status: job.status,
          createdAt: job.createdAt,
          client: toPublicClient(
            job.client,
            verificationMap.get(clientId?.toString()) ?? null
          ),
        },
        "Job fetched successfully"
      )
    );
  }

  if (req.user.role === "student" && job.status !== "open") {
    throw new ApiError(403, "You are not allowed to view this job");
  }

  const jobResponse = { ...job };
  // Authenticated users can see the richer client summary used by detail views.
  jobResponse.client = await buildClientSummary(job.client?._id || job.client);

  return res
    .status(200)
    .json(new ApiResponse(200, jobResponse, "Job fetched successfully"));
});

const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const {
    title,
    category,
    description,
    requirements,
    skills,
    budget,
    duration,
    deadline,
    complexity,
    files,
  } = req.body || {};
  const submittedSkills = parseSkills(skills);

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can update jobs");
  }

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.client.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can update only your own jobs");
  }

  if (job.status === "closed") {
    throw new ApiError(400, "Closed jobs cannot be edited");
  }

  if (job.status === "cancelled") {
    throw new ApiError(400, "Cancelled jobs cannot be edited");
  }

  if (job.status === "suspended") {
    throw new ApiError(400, "Suspended jobs cannot be edited");
  }

  const project = await Project.exists({ job: job._id });

  if (project) {
    throw new ApiError(400, "Jobs with an active project cannot be edited");
  }

  const existingApplication = await Application.exists({ job: job._id });
  const hasApplications = Boolean(existingApplication);
  const acceptedApplication = hasApplications
    ? await Application.exists({ job: job._id, status: "accepted" })
    : null;
  const hasAcceptedApplication = Boolean(acceptedApplication);

  // Once students have applied, keep the core job terms stable.
  if (hasAcceptedApplication) {
    throw new ApiError(400, "Jobs with accepted applications cannot be edited");
  }

  if (title !== undefined) {
    if (!title?.trim()) {
      throw new ApiError(400, "Job title is required");
    }

    job.title = title.trim();
  }

  if (description !== undefined) {
    if (!description?.trim() || description.trim().length < 20) {
      throw new ApiError(400, "Description must be at least 20 characters");
    }

    job.description = description.trim();
  }

  if (deadline !== undefined) {
    if (!deadline) {
      throw new ApiError(400, "Deadline is required");
    }

    const deadlineDate = new Date(deadline);

    if (Number.isNaN(deadlineDate.getTime())) {
      throw new ApiError(400, "Deadline must be a valid date");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      throw new ApiError(400, "Deadline cannot be in the past");
    }

    job.deadline = deadlineDate;
  }

  if (!hasApplications) {
    if (category !== undefined) {
      if (!category?.trim()) {
        throw new ApiError(400, "Category is required");
      }

      if (!VALID_JOB_CATEGORIES.includes(category.trim())) {
        throw new ApiError(400, "Category must be a valid job category");
      }

      job.category = category.trim();
    }

    if (requirements !== undefined) {
      if (!requirements?.trim()) {
        throw new ApiError(400, "Client requirements are required");
      }

      job.requirements = requirements.trim();
    }

    if (skills !== undefined) {
      if (!Array.isArray(submittedSkills)) {
        throw new ApiError(400, "Skills must be an array");
      }

      job.skills = submittedSkills;
    }

    if (budget !== undefined) {
      if (budget === null || String(budget).trim() === "") {
        throw new ApiError(400, "Budget is required");
      }

      const numericBudget = Number(budget);

      if (Number.isNaN(numericBudget)) {
        throw new ApiError(400, "Budget must be a valid amount");
      }

      if (numericBudget < MIN_JOB_BUDGET || numericBudget > MAX_JOB_BUDGET) {
        throw new ApiError(
          400,
          `Budget must be between Rs. ${MIN_JOB_BUDGET} and Rs. ${MAX_JOB_BUDGET}`
        );
      }

      job.budget = numericBudget;
    }

    if (duration !== undefined) {
      if (!duration?.trim()) {
        throw new ApiError(400, "Duration is required");
      }

      if (!VALID_JOB_DURATIONS.includes(duration.trim())) {
        throw new ApiError(400, "Duration must be a valid job duration");
      }

      job.duration = duration.trim();
    }

    if (complexity !== undefined) {
      if (!complexity?.trim()) {
        throw new ApiError(400, "Complexity is required");
      }

      if (!["small", "medium"].includes(complexity)) {
        throw new ApiError(400, "Complexity must be small or medium");
      }

      job.complexity = complexity;
    }

    if (
      files !== undefined ||
      (Array.isArray(req.files) && req.files.length > 0)
    ) {
      if (files !== undefined && !Array.isArray(files)) {
        throw new ApiError(400, "Files must be an array");
      }

      job.attachments = await uploadJobAttachments(req.files, files);
    }
  } else {
    if (
      category !== undefined ||
      requirements !== undefined ||
      skills !== undefined ||
      budget !== undefined ||
      duration !== undefined ||
      complexity !== undefined ||
      files !== undefined ||
      (Array.isArray(req.files) && req.files.length > 0)
    ) {
      if (skills !== undefined && !Array.isArray(submittedSkills)) {
        throw new ApiError(400, "Skills must be an array");
      }

      if (files !== undefined && !Array.isArray(files)) {
        throw new ApiError(400, "Files must be an array");
      }

      const nextSkills = Array.isArray(submittedSkills)
        ? submittedSkills
        : job.skills;
      const skillsChanged =
        JSON.stringify(nextSkills) !== JSON.stringify(job.skills);
      const submittedAttachments = Array.isArray(files)
        ? normalizeSubmittedAttachments(files)
        : job.attachments;
      const filesChanged =
        (Array.isArray(req.files) && req.files.length > 0) ||
        JSON.stringify(submittedAttachments) !==
          JSON.stringify(job.attachments);

      if (
        (category !== undefined && category !== job.category) ||
        (requirements !== undefined && requirements !== job.requirements) ||
        skillsChanged ||
        (budget !== undefined && Number(budget) !== job.budget) ||
        (duration !== undefined && duration !== job.duration) ||
        (complexity !== undefined && complexity !== job.complexity) ||
        filesChanged
      ) {
        throw new ApiError(
          400,
          "Only title, description, and deadline can be changed after applications are submitted"
        );
      }
    }
  }

  const updatedJob = await job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedJob, "Job updated successfully"));
});

const cancelJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can cancel jobs");
  }

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.client.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can cancel only your own jobs");
  }

  if (job.status === "closed") {
    throw new ApiError(400, "Closed jobs cannot be cancelled");
  }

  if (job.status === "cancelled") {
    throw new ApiError(400, "Job is already cancelled");
  }

  if (job.status === "suspended") {
    throw new ApiError(400, "Suspended jobs cannot be cancelled");
  }

  const project = await Project.exists({ job: job._id });

  if (project) {
    throw new ApiError(400, "Jobs with an active project cannot be cancelled");
  }

  job.status = "cancelled";

  const cancelledJob = await job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cancelledJob, "Job cancelled successfully"));
});

export {
  createJob,
  getClientJobs,
  getAllOpenJobs,
  getJobById,
  updateJob,
  cancelJob,
};
