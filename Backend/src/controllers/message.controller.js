import {
  createProjectMessage,
  getProjectMessages,
  markMessageAsRead,
} from "../services/message.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
 * Handles project message listing, creation, and read status updates.
 */
const getMessagesByProject = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const messages = await getProjectMessages(req.params.projectId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messages },
        "Project messages fetched successfully"
      )
    );
});

const createMessage = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const message = await createProjectMessage({
    projectId: req.params.projectId,
    senderId: req.user._id,
    message: req.body?.message,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, message, "Message created successfully"));
});

const markMessageRead = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const message = await markMessageAsRead(req.params.messageId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message marked as read successfully"));
});

export { createMessage, getMessagesByProject, markMessageRead };
