const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

export type ApplicationPayload = {
  coverLetter: string;
  estimatedCompletionTime: string;
  whySuitable: string;
  files?: File[];
};

export type ApplicationData = {
  _id: string;
  job: string;
  student: string;
  coverMessage: string;
  estimatedCompletionTime: string;
  whySuitable: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  appliedAt: string;
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export const createApplication = async (
  jobId: string,
  payload: ApplicationPayload
): Promise<ApiResponse<ApplicationData>> => {
  const formData = new FormData();

  formData.append("coverLetter", payload.coverLetter);
  formData.append("estimatedCompletionTime", payload.estimatedCompletionTime);
  formData.append("whySuitable", payload.whySuitable);

  payload.files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await fetch(`${API_URL}/applications/${jobId}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit application.");
  }

  return data;
};
