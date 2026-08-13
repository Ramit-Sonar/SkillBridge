import type { ApiResponse } from "./applicationService";
import { getApiBaseUrl } from "./apiConfig";
import type { FileAttachment } from "../utils/fileUtils";

const API_URL = getApiBaseUrl();

export type ProjectMessageSender = {
  id: string;
  fullName: string;
  avatar: string;
  role: "student" | "client" | string;
};

export type ProjectMessage = {
  id: string;
  project: string;
  sender: ProjectMessageSender;
  message: string;
  attachments: FileAttachment[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMessagesResponse = {
  messages: ProjectMessage[];
};

const parseMessageResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const getProjectMessages = async (
  projectId: string
): Promise<ApiResponse<ProjectMessagesResponse>> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/messages`, {
    method: "GET",
    credentials: "include",
  });

  return parseMessageResponse<ProjectMessagesResponse>(
    response,
    "Failed to fetch project messages."
  );
};

export const sendProjectMessage = async (
  projectId: string,
  message: string,
  attachments: File[] = []
): Promise<ApiResponse<ProjectMessage>> => {
  const hasAttachments = attachments.length > 0;
  const body = hasAttachments ? new FormData() : JSON.stringify({ message });
  const headers = hasAttachments ? undefined : { "Content-Type": "application/json" };

  if (hasAttachments && body instanceof FormData) {
    body.append("message", message);
    attachments.forEach((attachment) => body.append("attachments", attachment));
  }

  const response = await fetch(`${API_URL}/projects/${projectId}/messages`, {
    method: "POST",
    credentials: "include",
    headers,
    body,
  });

  return parseMessageResponse<ProjectMessage>(response, "Failed to send project message.");
};

export const markProjectMessageRead = async (
  messageId: string
): Promise<ApiResponse<ProjectMessage>> => {
  const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
    method: "PATCH",
    credentials: "include",
  });

  return parseMessageResponse<ProjectMessage>(response, "Failed to mark message as read.");
};
