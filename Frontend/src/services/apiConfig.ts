const DEFAULT_USERS_API_URL = "http://localhost:3000/api/v1/users";
const DEFAULT_SOCKET_URL = "http://localhost:3000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

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

  if (typeof window !== "undefined") {
    return apiPath;
  }

  return `${url.origin}${apiPath}`;
};

export const getSocketBaseUrl = () => {
  const configuredSocketUrl = (import.meta.env.VITE_SOCKET_URL || "").trim();

  if (configuredSocketUrl) {
    return trimTrailingSlash(configuredSocketUrl);
  }

  const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();

  if (configuredApiUrl && !configuredApiUrl.startsWith("/")) {
    try {
      return new URL(configuredApiUrl).origin;
    } catch {
      return trimTrailingSlash(configuredApiUrl);
    }
  }

  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return DEFAULT_SOCKET_URL;
    }

    return window.location.origin;
  }

  return DEFAULT_SOCKET_URL;
};

export const MAINTENANCE_MODE_CODE = "MAINTENANCE_MODE";
export const MAINTENANCE_STORAGE_KEY = "skillbridge:maintenance";

export type MaintenanceResponseData = {
  success?: false;
  code?: string;
  errorCode?: string;
  message?: string;
  maintenanceMessage?: string;
  platformName?: string;
  supportEmail?: string;
  platformDescription?: string;
  authenticated?: boolean;
};

export class MaintenanceModeError extends Error {
  code = MAINTENANCE_MODE_CODE;

  constructor(message = "The platform is currently under maintenance.") {
    super(message);
    this.name = "MaintenanceModeError";
  }
}

export const isMaintenanceResponseData = (data: unknown): data is MaintenanceResponseData => {
  if (!data || typeof data !== "object") return false;

  const payload = data as MaintenanceResponseData;
  return payload.code === MAINTENANCE_MODE_CODE || payload.errorCode === MAINTENANCE_MODE_CODE;
};

export const isMaintenanceModeError = (error: unknown) => {
  return error instanceof MaintenanceModeError;
};

export const saveMaintenanceState = (data: MaintenanceResponseData) => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(
    MAINTENANCE_STORAGE_KEY,
    JSON.stringify({
      message: data.message || "The platform is currently under maintenance.",
      maintenanceMessage:
        data.maintenanceMessage || data.message || "The platform is currently under maintenance.",
      platformName: data.platformName,
      supportEmail: data.supportEmail,
      platformDescription: data.platformDescription,
    })
  );
};

export const getStoredMaintenanceState = () => {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(MAINTENANCE_STORAGE_KEY);
    return stored
      ? (JSON.parse(stored) as {
          message: string;
          maintenanceMessage: string;
          platformName?: string;
          supportEmail?: string;
          platformDescription?: string;
        })
      : null;
  } catch {
    return null;
  }
};

export const redirectToMaintenance = (data: MaintenanceResponseData) => {
  if (typeof window === "undefined") return;

  saveMaintenanceState(data);

  if (window.location.pathname.startsWith("/admin")) return;
  if (window.location.pathname === "/maintenance") return;

  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/maintenance?returnTo=${encodeURIComponent(returnTo)}`);
};

declare global {
  interface Window {
    __skillBridgeMaintenanceFetchInstalled?: boolean;
  }
}

export const installMaintenanceModeInterceptor = () => {
  if (typeof window === "undefined" || window.__skillBridgeMaintenanceFetchInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    if (response.status === 503) {
      try {
        const data = (await response.clone().json()) as unknown;

        if (isMaintenanceResponseData(data)) {
          redirectToMaintenance(data);
        }
      } catch {
        // Non-JSON 503 responses should continue through the existing service error flow.
      }
    }

    return response;
  };

  window.__skillBridgeMaintenanceFetchInstalled = true;
};
