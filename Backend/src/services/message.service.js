import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/ApiError.js";

const isProjectParticipant = (project, userId) => {
  const currentUserId = userId?.toString();

  return (
    project?.client?.toString() === currentUserId ||
    project?.student?.toString() === currentUserId
  );
};

export const ensureProjectMessageAccess = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const project = await Project.findById(projectId)
    .select("_id client student")
    .lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!isProjectParticipant(project, userId)) {
    throw new ApiError(
      403,
      "You can access messages only for your own project"
    );
  }

  return project;
};

export const buildMessageSummary = (message) => ({
  id: message._id?.toString(),
  project:
    message.project?._id?.toString?.() ||
    message.project?.toString?.() ||
    message.project,
  sender: {
    id:
      message.sender?._id?.toString?.() ||
      message.sender?.toString?.() ||
      message.sender,
    fullName: message.sender?.fullName || "",
    avatar: message.sender?.avatar || "",
    role: message.sender?.role || "",
  },
  message: message.message,
  isRead: Boolean(message.isRead),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

export const getProjectMessages = async (projectId, userId) => {
  const project = await ensureProjectMessageAccess(projectId, userId);

  const messages = await Message.find({ project: project._id })
    .select("_id project sender message isRead createdAt updatedAt")
    .populate({
      path: "sender",
      select: "_id fullName avatar role",
    })
    .sort({ createdAt: 1 })
    .lean();

  return messages.map(buildMessageSummary);
};

export const createProjectMessage = async ({
  projectId,
  senderId,
  message,
}) => {
  const project = await ensureProjectMessageAccess(projectId, senderId);

  if (typeof message !== "string" || !message.trim()) {
    throw new ApiError(400, "Message is required");
  }

  const createdMessage = await Message.create({
    project: project._id,
    sender: senderId,
    message: message.trim(),
  });

  const populatedMessage = await Message.findById(createdMessage._id)
    .select("_id project sender message isRead createdAt updatedAt")
    .populate({
      path: "sender",
      select: "_id fullName avatar role",
    })
    .lean();

  return buildMessageSummary(populatedMessage);
};

export const markMessageAsRead = async (messageId, userId) => {
  if (!mongoose.isValidObjectId(messageId)) {
    throw new ApiError(400, "Invalid message id");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const message = await Message.findById(messageId)
    .select("_id project sender message isRead createdAt updatedAt")
    .lean();

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  await ensureProjectMessageAccess(message.project, userId);

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    { isRead: true },
    { new: true, runValidators: true }
  )
    .select("_id project sender message isRead createdAt updatedAt")
    .populate({
      path: "sender",
      select: "_id fullName avatar role",
    })
    .lean();

  return buildMessageSummary(updatedMessage);
};
