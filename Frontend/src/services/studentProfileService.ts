import type { StudentSummary } from "./applicationService";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

export type StudentProfileData = {
  _id?: string;
  user?: string;
  bio?: string;
  education?: string;
  university?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export const getStudentProfile = async (): Promise<ApiResponse<StudentProfileData | null>> => {
  const response = await fetch(`${API_URL}/student/profile`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateStudentProfile = async (
  profileData: Partial<StudentProfileData>
): Promise<ApiResponse<StudentProfileData>> => {
  const response = await fetch(`${API_URL}/student/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getPublicStudentProfile = async (
  studentId: string
): Promise<ApiResponse<StudentSummary>> => {
  const response = await fetch(`${API_URL}/student/public-profile/${studentId}`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};
