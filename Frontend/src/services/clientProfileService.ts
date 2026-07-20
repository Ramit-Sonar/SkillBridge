const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users").replace(
  /\/users\/?$/,
  ""
);

/**
 * Client profile service handles authenticated client profile reads and updates.
 */
export type ClientProfileData = {
  _id?: string;
  user?: string;
  bio?: string;
  location?: string;
  companyName?: string;
  website?: string;
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export const getClientProfile = async (): Promise<ApiResponse<ClientProfileData | null>> => {
  const response = await fetch(`${API_URL}/client/profile`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateClientProfile = async (
  profileData: Partial<ClientProfileData>
): Promise<ApiResponse<ClientProfileData>> => {
  const response = await fetch(`${API_URL}/client/profile`, {
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
