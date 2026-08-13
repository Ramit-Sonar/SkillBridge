import {
  createProjectMessage,
  getMessageAttachmentForDownload,
  getProjectMessages,
  markMessageAsRead,
} from "../services/message.service.js";
import {
  emitProjectMessageCreated,
  emitProjectMessageRead,
} from "../socket/projectMessage.socket.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteAttachments, uploadAttachments } from "../utils/attachment.js";
import { getCloudinaryDownloadUrls } from "../utils/cloudinary.js";
import { getPaginationParams } from "../utils/pagination.js";

const sanitizeDownloadFileName = (fileName = "attachment") =>
  fileName.replace(/[\\/:*?"<>|]/g, "_").trim() || "attachment";

const fetchAttachmentFile = async (attachment) => {
  const urls = [attachment.url, ...getCloudinaryDownloadUrls(attachment)];

  for (const url of urls) {
    try {
      const fileResponse = await fetch(url);

      if (fileResponse.ok) return fileResponse;
    } catch {
      // Try the next download URL candidate.
    }
  }

  return null;
};

/*
 * Handles project message listing, creation, and read status updates.
 */
const getMessagesByProject = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const paginationParams = getPaginationParams({
    ...req.query,
    limit: req.query?.limit || "30",
  });
  const { messages, pagination } = await getProjectMessages(
    req.params.projectId,
    req.user._id,
    paginationParams
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messages },
        "Project messages fetched successfully",
        pagination
      )
    );
});

const createMessage = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  let attachments = [];

  try {
    attachments = await uploadAttachments(req.files);

    const message = await createProjectMessage({
      projectId: req.params.projectId,
      senderId: req.user._id,
      message: req.body?.message,
      attachments,
    });

    emitProjectMessageCreated(message);

    return res
      .status(201)
      .json(new ApiResponse(201, message, "Message created successfully"));
  } catch (error) {
    await deleteAttachments(attachments);
    throw error;
  }
});

const markMessageRead = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const message = await markMessageAsRead(req.params.messageId, req.user._id);

  emitProjectMessageRead(message);

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message marked as read successfully"));
});

const downloadMessageAttachment = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const attachment = await getMessageAttachmentForDownload({
    messageId: req.params.messageId,
    attachmentIndex: req.params.attachmentIndex,
    userId: req.user._id,
  });
  let attachmentUrl;

  try {
    attachmentUrl = new URL(attachment.url);
  } catch {
    throw new ApiError(400, "Attachment link is invalid");
  }

  if (!["http:", "https:"].includes(attachmentUrl.protocol)) {
    throw new ApiError(400, "Attachment link is invalid");
  }

  const fileResponse = await fetchAttachmentFile(attachment);

  if (!fileResponse) {
    throw new ApiError(502, "Attachment could not be downloaded");
  }

  const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
  const fileName = sanitizeDownloadFileName(attachment.originalName);
  const contentType =
    attachment.mimeType ||
    fileResponse.headers.get("content-type") ||
    "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", fileBuffer.length);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  );

  return res.status(200).send(fileBuffer);
});

export {
  createMessage,
  downloadMessageAttachment,
  getMessagesByProject,
  markMessageRead,
};
