import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/pagination.js";

const MAX_MESSAGE_LENGTH = 2000;

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
  attachments: message.attachments || [],
  isRead: Boolean(message.isRead),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

export const getProjectMessages = async (
  projectId,
  userId,
  { page = 1, limit = 30, skip = 0 } = {}
) => {
  const project = await ensureProjectMessageAccess(projectId, userId);

  const filter = { project: project._id };
  const [messages, totalMessages] = await Promise.all([
    Message.find(filter)
      .select(
        "_id project sender message attachments isRead createdAt updatedAt"
      )
      .populate({
        path: "sender",
        select: "_id fullName avatar role",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments(filter),
  ]);

  return {
    messages: messages.reverse().map(buildMessageSummary),
    pagination: buildPagination({ page, limit, total: totalMessages }),
  };
};

export const getMessageAttachmentForDownload = async ({
  messageId,
  attachmentIndex,
  userId,
}) => {
  if (!mongoose.isValidObjectId(messageId)) {
    throw new ApiError(400, "Invalid message id");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const index = Number(attachmentIndex);

  if (!Number.isInteger(index) || index < 0) {
    throw new ApiError(400, "Invalid attachment index");
  }

  const message = await Message.findById(messageId)
    .select("_id project attachments")
    .lean();

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  await ensureProjectMessageAccess(message.project, userId);

  const attachment = message.attachments?.[index];

  if (!attachment?.url) {
    throw new ApiError(404, "Attachment not found");
  }

  return attachment;
};

export const createProjectMessage = async ({
  projectId,
  senderId,
  message,
  attachments = [],
}) => {
  const project = await ensureProjectMessageAccess(projectId, senderId);
  const messageText = typeof message === "string" ? message.trim() : "";
  const messageAttachments = Array.isArray(attachments) ? attachments : [];

  if (!messageText && messageAttachments.length === 0) {
    throw new ApiError(400, "Message is required");
  }

  if (messageText.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, "Message cannot exceed 2000 characters");
  }

  const createdMessage = await Message.create({
    project: project._id,
    sender: senderId,
    message: messageText,
    attachments: messageAttachments,
  });

  const populatedMessage = await Message.findById(createdMessage._id)
    .select("_id project sender message attachments isRead createdAt updatedAt")
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
    .select("_id project sender message attachments isRead createdAt updatedAt")
    .lean();

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender?.toString() === userId.toString()) {
    throw new ApiError(403, "You cannot mark your own message as read");
  }

  await ensureProjectMessageAccess(message.project, userId);

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    { isRead: true },
    { new: true, runValidators: true }
  )
    .select("_id project sender message attachments isRead createdAt updatedAt")
    .populate({
      path: "sender",
      select: "_id fullName avatar role",
    })
    .lean();

  return buildMessageSummary(updatedMessage);
};
