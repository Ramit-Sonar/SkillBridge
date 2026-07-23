/**
 * Shapes report records for admin report lists, detail modals, and actions.
 */
const getInitials = (fullName = "") => {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const buildReportUserSummary = (user) => {
  if (!user) return null;

  const fullName = user.fullName || "Unknown User";

  return {
    id: user._id?.toString(),
    fullName,
    name: fullName,
    initials: getInitials(fullName),
    email: user.email || "",
    role: user.role || "user",
    avatar: user.avatar || "",
    profileCompleted: Boolean(user.profileCompleted),
  };
};

const buildReportSummary = (report) => {
  const reporter = buildReportUserSummary(report.reporter);
  const reportedUser = buildReportUserSummary(report.reportedUser);

  return {
    id: report._id,
    reportId: report._id,
    reporterUserId: reporter?.id || "",
    reporterName: reporter?.fullName || "Unknown User",
    reporterInitials: reporter?.initials || "",
    reporterRole: reporter?.role || "user",
    reportedUserId: reportedUser?.id || "",
    reportedUserName: reportedUser?.fullName || "Unknown User",
    reportedUserRole: reportedUser?.role || "user",
    reason: report.reason,
    description: report.description,
    attachments: report.attachments || [],
    status: report.status,
    submittedAt: report.createdAt,
    resolvedAt: report.resolvedAt,
    dismissedAt: report.dismissedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter,
    reportedUser,
    handledBy: buildReportUserSummary(report.handledBy),
  };
};

export { buildReportSummary, buildReportUserSummary };
