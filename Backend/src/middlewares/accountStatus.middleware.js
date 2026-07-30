import { ApiError } from "../utils/ApiError.js";

/**
 * Blocks marketplace write actions for suspended authenticated accounts.
 */
export const ensureActiveAccount = (req, res, next) => {
  if (req.user?.accountStatus !== "suspended") {
    next();
    return;
  }

  next(
    new ApiError(
      403,
      "Your account has been suspended.",
      [],
      "ACCOUNT_SUSPENDED"
    )
  );
};
