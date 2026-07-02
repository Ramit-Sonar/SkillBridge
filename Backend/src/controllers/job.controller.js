import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const VALID_JOB_CATEGORIES = [
  "web-dev",
  "ui-ux",
  "graphic",
  "documentation",
  "presentation",
  "other",
];

const VALID_JOB_DURATIONS = ["1d", "3d", "5d", "7d", "14d"];

const createJob = asyncHandler(async (req, res) => {
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

  if (budget === undefined || budget === null || String(budget).trim() === "") {
    throw new ApiError(400, "Budget is required");
  }

  const numericBudget = Number(budget);

  if (Number.isNaN(numericBudget) || numericBudget < 0) {
    throw new ApiError(400, "Budget must be a valid amount");
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

  if (skills !== undefined && !Array.isArray(skills)) {
    throw new ApiError(400, "Skills must be an array");
  }

  if (files !== undefined && !Array.isArray(files)) {
    throw new ApiError(400, "Files must be an array");
  }

  const attachments = Array.isArray(files)
    ? files
        .map((file) => {
          if (typeof file === "string") return file.trim();
          return file?.name?.trim() || "";
        })
        .filter(Boolean)
    : [];

  const job = await Job.create({
    client: req.user._id,
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    requirements: requirements.trim(),
    skills: Array.isArray(skills) ? skills : [],
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
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, "Client jobs fetched successfully"));
});

const getAllOpenJobs = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can browse open jobs");
  }

  const jobs = await Job.find({
    status: "open",
  })
    .select("title category description budget duration deadline skills status createdAt")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, "Open jobs fetched successfully"));
});

const getJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(jobId).populate("client", "fullName avatar createdAt");

  // TODO: Add verified status, client bio, rating, completed project count,
  // and review stats after Verification, ClientProfile, Project, and Review modules expose them.

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, job, "Job fetched successfully"));
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
      if (!Array.isArray(skills)) {
        throw new ApiError(400, "Skills must be an array");
      }

      job.skills = skills;
    }

    if (budget !== undefined) {
      if (budget === null || String(budget).trim() === "") {
        throw new ApiError(400, "Budget is required");
      }

      const numericBudget = Number(budget);

      if (Number.isNaN(numericBudget) || numericBudget < 0) {
        throw new ApiError(400, "Budget must be a valid amount");
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

    if (files !== undefined) {
      if (!Array.isArray(files)) {
        throw new ApiError(400, "Files must be an array");
      }

      job.attachments = files
        .map((file) => {
          if (typeof file === "string") return file.trim();
          return file?.name?.trim() || "";
        })
        .filter(Boolean);
    }
  } else {
    if (
      category !== undefined ||
      requirements !== undefined ||
      skills !== undefined ||
      budget !== undefined ||
      duration !== undefined ||
      complexity !== undefined ||
      files !== undefined
    ) {
      if (skills !== undefined && !Array.isArray(skills)) {
        throw new ApiError(400, "Skills must be an array");
      }

      if (files !== undefined && !Array.isArray(files)) {
        throw new ApiError(400, "Files must be an array");
      }

      const submittedSkills = Array.isArray(skills) ? skills : job.skills;
      const skillsChanged =
        JSON.stringify(submittedSkills) !== JSON.stringify(job.skills);
      const submittedAttachments = Array.isArray(files)
        ? files
            .map((file) => {
              if (typeof file === "string") return file.trim();
              return file?.name?.trim() || "";
            })
            .filter(Boolean)
        : job.attachments;
      const filesChanged =
        JSON.stringify(submittedAttachments) !== JSON.stringify(job.attachments);

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
