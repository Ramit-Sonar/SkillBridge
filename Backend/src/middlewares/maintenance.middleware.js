import jwt from "jsonwebtoken";
import { PlatformSettings } from "../models/platformSettings.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DEFAULT_MAINTENANCE_MESSAGE =
  "SkillBridge is currently under maintenance.";

const getTokenRole = async (token, secret) => {
  if (!token || !secret) return "";

  try {
    const decodedToken = jwt.verify(token, secret);
    const user = await User.findById(decodedToken?._id).select("role").lean();

    return user?.role || "";
  } catch {
    return "";
  }
};

const getRequestRole = async (req) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const accessRole = await getTokenRole(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET
  );

  if (accessRole) return accessRole;

  return getTokenRole(refreshToken, process.env.REFRESH_TOKEN_SECRET);
};

const isAdminRequest = async (req, requestRole) => {
  if (req.originalUrl.startsWith("/api/v1/admin")) return true;

  if (
    req.originalUrl === "/api/v1/users/login" &&
    req.method === "POST" &&
    req.body?.loginType === "admin"
  ) {
    return true;
  }

  return requestRole === "admin";
};

export const maintenanceModeMiddleware = asyncHandler(
  async (req, res, next) => {
    if (!req.originalUrl.startsWith("/api/v1")) {
      next();
      return;
    }

    const settings = await PlatformSettings.findOne({ key: "platform" }).lean();

    if (!settings?.maintenanceMode) {
      next();
      return;
    }

    const requestRole = await getRequestRole(req);

    if (
      req.originalUrl === "/api/v1/users/logout" ||
      req.originalUrl === "/api/v1/users/refresh-token"
    ) {
      next();
      return;
    }

    if (await isAdminRequest(req, requestRole)) {
      next();
      return;
    }

    return res.status(503).json({
      success: false,
      code: "MAINTENANCE_MODE",
      errorCode: "MAINTENANCE_MODE",
      message: DEFAULT_MAINTENANCE_MESSAGE,
      authenticated: ["student", "client"].includes(requestRole),
      maintenanceMessage:
        settings.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE,
    });
  }
);
