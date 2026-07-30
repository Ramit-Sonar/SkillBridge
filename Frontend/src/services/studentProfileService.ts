import type { StudentSummary } from "./applicationService";
import type { FileAttachment } from "../utils/fileUtils";
import { getApiBaseUrl } from "./apiConfig";

const API_URL = getApiBaseUrl();

/**
 * Student profile service handles private edits and public profile reads.
 */
export type StudentProfileData = {
  _id?: string;
  user?: string;
  bio?: string;
  education?: string;
  university?: string;
  skills?: string[];
  verifiedSkills?: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  certificates?: StudentCertificate[];
};

export type StudentCertificate = {
  id: string;
  _id?: string;
  title: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string;
  credentialUrl?: string;
  file: FileAttachment;
};

export type CertificatePayload = {
  title: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  file?: File;
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

export const getStudentCertificates = async (): Promise<
  ApiResponse<{ certificates: StudentCertificate[] }>
> => {
  const response = await fetch(`${API_URL}/student/certificates`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

const buildCertificateFormData = (payload: CertificatePayload) => {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("issuingOrganization", payload.issuingOrganization);
  formData.append("issueDate", payload.issueDate);
  formData.append("expiryDate", payload.expiryDate ?? "");
  formData.append("credentialId", payload.credentialId ?? "");
  formData.append("credentialUrl", payload.credentialUrl ?? "");

  if (payload.file) {
    formData.append("certificateFile", payload.file);
  }

  return formData;
};

export const uploadStudentCertificate = async (
  payload: CertificatePayload & { file: File }
): Promise<ApiResponse<StudentCertificate>> => {
  const response = await fetch(`${API_URL}/student/certificates`, {
    method: "POST",
    credentials: "include",
    body: buildCertificateFormData(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateStudentCertificate = async (
  certificateId: string,
  payload: CertificatePayload
): Promise<ApiResponse<StudentCertificate>> => {
  const response = await fetch(`${API_URL}/student/certificates/${certificateId}`, {
    method: "PATCH",
    credentials: "include",
    body: buildCertificateFormData(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const deleteStudentCertificate = async (
  certificateId: string
): Promise<ApiResponse<{ certificateId: string }>> => {
  const response = await fetch(`${API_URL}/student/certificates/${certificateId}`, {
    method: "DELETE",
    credentials: "include",
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
