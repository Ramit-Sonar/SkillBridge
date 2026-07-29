import { refreshToken } from "./refreshToken";
import {
  getApiBaseUrl,
  isMaintenanceResponseData,
  MaintenanceModeError,
  redirectToMaintenance,
} from "./apiConfig";

const API_URL = getApiBaseUrl();

/**
 * Auth service methods call the user API and keep cookie-based sessions intact.
 */
type Role = "student" | "client" | "admin";

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  accountStatus?: "active" | "suspended";
  suspensionReason?: string;
  suspendedAt?: string;
  avatar?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

let currentUserRequest: Promise<ApiResponse<AuthUser>> | null = null;

export const registerUser = async (userData: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): Promise<ApiResponse<AuthUser>> => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

//this two sendVerificationOtp and  for verify user email
export const sendVerificationOtp = async (userData: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): Promise<ApiResponse<{}>> => {
  const response = await fetch(`${API_URL}/users/send-verification-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const verifyEmail = async (email: string, otp: string): Promise<ApiResponse<AuthUser>> => {
  const response = await fetch(`${API_URL}/users/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const loginUser = async (userData: {
  email: string;
  password: string;
  loginType?: "common" | "admin";
}): Promise<
  ApiResponse<{
    user: AuthUser;
  }>
> => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

//this two forgotPassword and resetPassword for forgot passwod logic
export const forgotPassword = async (email: string): Promise<ApiResponse<{}>> => {
  const response = await fetch(`${API_URL}/users/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const resetPassword = async (
  token: string,
  password: string,
  confirmPassword: string
): Promise<ApiResponse<{}>> => {
  const response = await fetch(`${API_URL}/users/reset-password/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password, confirmPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const changePassword = async (passwordData: {
  oldPassword: string;
  newPassword: string;
}): Promise<ApiResponse<{}>> => {
  const response = await fetch(`${API_URL}/users/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(passwordData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateAccountDetails = async (accountData: {
  fullName: string;
  email: string;
}): Promise<ApiResponse<AuthUser>> => {
  const response = await fetch(`${API_URL}/users/update-account`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(accountData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const uploadAvatar = async (avatar: File): Promise<ApiResponse<AuthUser>> => {
  const formData = new FormData();
  formData.append("avatar", avatar);

  const response = await fetch(`${API_URL}/users/avatar`, {
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

export const logoutUser = async () => {
  const requestLogout = () =>
    fetch(`${API_URL}/users/logout`, {
      method: "POST",
      credentials: "include",
    });

  let response = await requestLogout();

  if (response.status === 401) {
    // Logout is protected, so refresh once if the access token expired.
    const refreshSuccess = await refreshToken();

    if (refreshSuccess) {
      response = await requestLogout();
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

const requestCurrentUser = async (): Promise<ApiResponse<AuthUser>> => {
  const fetchCurrentUser = () =>
    fetch(`${API_URL}/users/current-user`, {
      method: "GET",
      credentials: "include",
    });

  const isProtectedPage =
    window.location.pathname.startsWith("/dashboard") ||
    window.location.pathname.startsWith("/admin/dashboard") ||
    window.location.pathname.startsWith("/admin/users") ||
    window.location.pathname.startsWith("/admin/jobs") ||
    window.location.pathname.startsWith("/admin/settings") ||
    window.location.pathname.startsWith("/admin/students");

  const redirectPath = window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login";

  let response = await fetchCurrentUser();

  if (response.status === 401 && isProtectedPage) {
    // Try refresh once, then retry the original request once.
    const refreshSuccess = await refreshToken();

    if (refreshSuccess) {
      response = await fetchCurrentUser();
    } else {
      window.location.href = redirectPath;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    if (isMaintenanceResponseData(data)) {
      redirectToMaintenance(data);
      throw new MaintenanceModeError(data.maintenanceMessage || data.message);
    }

    if (isProtectedPage) {
      window.location.href = redirectPath;
    }

    throw new Error(data.message);
  }

  return data;
};

export const getCurrentUser = async (): Promise<ApiResponse<AuthUser>> => {
  if (currentUserRequest) {
    return currentUserRequest;
  }

  currentUserRequest = requestCurrentUser().finally(() => {
    currentUserRequest = null;
  });

  return currentUserRequest;
};
