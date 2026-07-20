import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Restricts protected routes to the roles passed by the route definition.
 */
export const authorizeRoles = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    // req.user comes from verifyJWT middleware
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    // check role
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. ${req.user.role} is not allowed to access this route`
      );
    }
     
    next();
  });
};
