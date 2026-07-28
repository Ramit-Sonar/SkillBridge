import { getApiBaseUrl } from "./apiConfig";

const API_URL = getApiBaseUrl();

/**
 * Refreshes the cookie session without exposing token details to components.
 */
export const refreshToken = async () => {
  const response = await fetch(`${API_URL}/users/refresh-token`, {
    method: "POST",
    credentials: "include",
  });

  return response.ok;
};
