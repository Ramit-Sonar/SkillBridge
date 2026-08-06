import type { ApiResponse } from "./applicationService";
import { getApiBaseUrl } from "./apiConfig";

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
  message: string
): Promise<ApiResponse<ProjectMessage>> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
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
