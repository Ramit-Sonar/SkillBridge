const DEFAULT_USERS_API_URL = "http://localhost:3000/api/v1/users";

const normalizeApiPath = (path: string) => {
  const normalizedPath = path.replace(/\/+$/, "");

  if (!normalizedPath || normalizedPath === "/") {
    return "/api/v1";
  }

  if (normalizedPath.endsWith("/api/v1/users")) {
    return normalizedPath.replace(/\/users$/, "");
  }

  if (normalizedPath.endsWith("/api/v1")) {
    return normalizedPath;
  }

  if (normalizedPath.endsWith("/api")) {
    return `${normalizedPath}/v1`;
  }

  return `${normalizedPath}/api/v1`;
};

export const getApiBaseUrl = () => {
  const configuredUrl = (import.meta.env.VITE_API_URL || DEFAULT_USERS_API_URL).trim();

  if (configuredUrl.startsWith("/")) {
    return normalizeApiPath(configuredUrl);
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    return normalizeApiPath(configuredUrl);
  }

  const apiPath = normalizeApiPath(url.pathname);

  if (typeof window !== "undefined" && url.origin === window.location.origin) {
    return apiPath;
  }

  return `${url.origin}${apiPath}`;
};
