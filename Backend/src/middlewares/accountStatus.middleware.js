/**
 * Blocks marketplace write actions for suspended authenticated accounts.
 */
export const ensureActiveAccount = (req, res, next) => {
  if (req.user?.accountStatus !== "suspended") {
    next();
    return;
  }

  return res.status(403).json({
    success: false,
    errorCode: "ACCOUNT_SUSPENDED",
    message: "Your account has been suspended.",
  });
};
