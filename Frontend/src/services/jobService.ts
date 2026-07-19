const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

export type JobAttachment = {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type ClientSummary = {
  id: string;
  fullName: string;
  avatar?: string;
  joined?: string;
  location?: string;
  companyName?: string;
  website?: string;
  bio?: string;
  verification: {
    status: string | null;
    verifiedAt?: string | null;
  };
  statistics: {
    jobsPosted: number;
    projectsCompleted: number | null;
    activeProjects?: number | null;
    totalReviews?: number | null;
    averageRating?: number | null;
  };
};

export type JobData = {
  _id?: string;
  client?: ClientSummary | string | null;
  title: string;
  category: string;
  description?: string;
  requirements?: string;
  skills: string[];
  budget: number | string;
  duration: string;
  deadline: string;
  complexity?: "small" | "medium";
  attachments?: JobAttachment[];
  status?: "open" | "closed" | "cancelled";
  applicationCount?: number;
  pendingApplicationCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type JobPayload = {
  title: string;
  category: string;
  description: string;
  requirements: string;
  skills: string[];
  budget: string;
  duration: string;
  deadline: string;
  complexity: string;
  files?: File[];
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export const createJob = async (jobData: JobPayload): Promise<ApiResponse<JobData>> => {
  const formData = new FormData();

  formData.append("title", jobData.title);
  formData.append("category", jobData.category);
  formData.append("description", jobData.description);
  formData.append("requirements", jobData.requirements);
  formData.append("skills", JSON.stringify(jobData.skills));
  formData.append("budget", jobData.budget);
  formData.append("duration", jobData.duration);
  formData.append("deadline", jobData.deadline);
  formData.append("complexity", jobData.complexity);

  jobData.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getClientJobs = async (): Promise<ApiResponse<JobData[]>> => {
  const response = await fetch(`${API_URL}/jobs/my-jobs`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getAllOpenJobs = async (): Promise<ApiResponse<JobData[]>> => {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getJobById = async (jobId: string): Promise<ApiResponse<JobData>> => {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateJob = async (
  jobId: string,
  jobData: Partial<JobPayload>
): Promise<ApiResponse<JobData>> => {
  const formData = new FormData();

  if (jobData.title !== undefined) formData.append("title", jobData.title);
  if (jobData.category !== undefined) formData.append("category", jobData.category);
  if (jobData.description !== undefined) formData.append("description", jobData.description);
  if (jobData.requirements !== undefined) formData.append("requirements", jobData.requirements);
  if (jobData.skills !== undefined) formData.append("skills", JSON.stringify(jobData.skills));
  if (jobData.budget !== undefined) formData.append("budget", jobData.budget);
  if (jobData.duration !== undefined) formData.append("duration", jobData.duration);
  if (jobData.deadline !== undefined) formData.append("deadline", jobData.deadline);
  if (jobData.complexity !== undefined) formData.append("complexity", jobData.complexity);

  jobData.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "PATCH",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const cancelJob = async (jobId: string): Promise<ApiResponse<JobData>> => {
  const response = await fetch(`${API_URL}/jobs/${jobId}/cancel`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};
