const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

/**
 * Verification service keeps student/client KYC submissions and admin review calls together.
 */
export type VerificationStatus = "pending" | "approved" | "rejected";

export type VerificationData = {
  _id?: string;
  user?: string;
  type?: "student" | "client";
  status?: VerificationStatus;
  collegeName?: string;
  studentId?: string;
  collegeIdCard?: string;
  studentSelfie?: string;
  legalName?: string;
  phone?: string;
  citizenshipFront?: string;
  citizenshipSelfie?: string;
  companyName?: string;
  companyRegistrationDocument?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string | null;
  approvedAt?: string;
  approvedBy?: string | null;
  rejectedAt?: string;
  rejectedBy?: string | null;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminStudentVerification = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "Student";
  avatar?: string;
  status: VerificationStatus;
  collegeName: string;
  studentId: string;
  collegeIdCard: string;
  studentSelfie: string;
  submittedAt: string;
};

export type AdminClientVerification = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "Client";
  status: VerificationStatus;
  legalName: string;
  phone: string;
  companyName: string;
  citizenshipFront: string;
  citizenshipSelfie: string;
  companyRegistrationDocument: string;
  submittedAt: string;
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export const submitStudentVerification = async (
  verificationData: FormData
): Promise<ApiResponse<VerificationData>> => {
  const response = await fetch(`${API_URL}/verification/student`, {
    method: "POST",
    credentials: "include",
    body: verificationData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const submitClientVerification = async (
  verificationData: FormData
): Promise<ApiResponse<VerificationData>> => {
  const response = await fetch(`${API_URL}/verification/client`, {
    method: "POST",
    credentials: "include",
    body: verificationData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getVerificationStatus = async (): Promise<ApiResponse<VerificationData | null>> => {
  const response = await fetch(`${API_URL}/verification/status`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getAdminStudentVerifications = async (): Promise<
  ApiResponse<AdminStudentVerification[]>
> => {
  const response = await fetch(`${API_URL}/verification/admin/students`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getAdminStudentVerificationById = async (
  verificationId: string
): Promise<ApiResponse<AdminStudentVerification>> => {
  const response = await fetch(`${API_URL}/verification/admin/students/${verificationId}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getAdminClientVerifications = async (): Promise<
  ApiResponse<AdminClientVerification[]>
> => {
  const response = await fetch(`${API_URL}/verification/admin/clients`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const approveVerification = async (
  verificationId: string
): Promise<ApiResponse<VerificationData>> => {
  const response = await fetch(`${API_URL}/verification/${verificationId}/approve`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const rejectVerification = async (
  verificationId: string
): Promise<ApiResponse<VerificationData>> => {
  const response = await fetch(`${API_URL}/verification/${verificationId}/reject`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateStudentVerification = async (
  verificationData: FormData
): Promise<ApiResponse<VerificationData>> => {
  const response = await fetch(`${API_URL}/verification/student`, {
    method: "PATCH",
    credentials: "include",
    body: verificationData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateClientVerification = async (
  verificationData: FormData
): Promise<ApiResponse<VerificationData>> => {
  const response = await fetch(`${API_URL}/verification/client`, {
    method: "PATCH",
    credentials: "include",
    body: verificationData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};
