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

const getFileNameFromContentDisposition = (header: string | null) => {
  if (!header) return "";

  const encodedFileName = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

  if (encodedFileName) {
    try {
      return decodeURIComponent(encodedFileName);
    } catch {
      return encodedFileName;
    }
  }

  return header.match(/filename="([^"]+)"/i)?.[1] || "";
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

export const downloadProjectMessageAttachment = async (
  messageId: string,
  attachmentIndex: number,
  fallbackFileName = "attachment"
) => {
  const response = await fetch(
    `${API_URL}/messages/${messageId}/attachments/${attachmentIndex}/download`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Attachment could not be downloaded.");
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const fileName =
    getFileNameFromContentDisposition(response.headers.get("content-disposition")) ||
    fallbackFileName.replace(/[\\/:*?"<>|]/g, "_").trim() ||
    "attachment";
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
};
