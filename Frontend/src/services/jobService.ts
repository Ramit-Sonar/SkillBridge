const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

export type JobData = {
  _id?: string;
  client?:
    | {
        _id?: string;
        fullName?: string;
        avatar?: string;
        createdAt?: string;
        location?: string;
        bio?: string;
        isVerified?: boolean;
        verified?: boolean;
        jobsPosted?: number;
        projectsCompleted?: number;
        completedProjects?: number;
        rating?: number;
      }
    | string;
  title: string;
  category: string;
  description?: string;
  requirements?: string;
  skills: string[];
  budget: number | string;
  duration: string;
  deadline: string;
  complexity?: "small" | "medium";
  attachments?: string[];
  status?: "open" | "closed" | "cancelled";
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
  files?: {
    name: string;
    size: number;
    type: string;
  }[];
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export const createJob = async (jobData: JobPayload): Promise<ApiResponse<JobData>> => {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(jobData),
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
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(jobData),
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
