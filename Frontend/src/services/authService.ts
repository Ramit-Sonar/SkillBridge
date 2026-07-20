import { refreshToken } from "./refreshToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1/users";

/**
 * Auth service methods call the user API and keep cookie-based sessions intact.
 */
type Role = "student" | "client" | "admin";

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
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

export const registerUser = async (userData: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): Promise<ApiResponse<AuthUser>> => {
  const response = await fetch(`${API_URL}/register`, {
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
  const response = await fetch(`${API_URL}/send-verification-otp`, {
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
  const response = await fetch(`${API_URL}/verify-email`, {
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
    accessToken: string;
    refreshToken: string;
  }>
> => {
  const response = await fetch(`${API_URL}/login`, {
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
  const response = await fetch(`${API_URL}/forgot-password`, {
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
  const response = await fetch(`${API_URL}/reset-password/${token}`, {
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
  const response = await fetch(`${API_URL}/change-password`, {
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
  const response = await fetch(`${API_URL}/update-account`, {
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

  const response = await fetch(`${API_URL}/avatar`, {
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
    fetch(`${API_URL}/logout`, {
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



export const getCurrentUser = async (): Promise<ApiResponse<AuthUser>> => {
  const requestCurrentUser = () =>
    fetch(`${API_URL}/current-user`, {
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

  let response = await requestCurrentUser();

  if (response.status === 401 && isProtectedPage) {
    // Try refresh once, then retry the original request once.
    const refreshSuccess = await refreshToken();

    if (refreshSuccess) {
      response = await requestCurrentUser();
    } else {
      window.location.href = redirectPath;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    if (isProtectedPage) {
      window.location.href = redirectPath;
    }

    throw new Error(data.message);
  }

  return data;
};
