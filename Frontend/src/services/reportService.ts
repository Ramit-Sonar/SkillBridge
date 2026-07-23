import {
  CLIENT_KYC_REQUESTS,
  PLATFORM_USERS,
  USER_REPORTS,
  VERIFICATION_REQUESTS,
  type ReportStatus,
  type UserReport,
} from "../app/data/admin";

export type ReportReason =
  "Scam / Fraud" | "Fake Profile" | "Harassment" | "Spam" | "Inappropriate Behavior" | "Other";

export type SubmitReportPayload = {
  reportedUserId?: string;
  reportedUserName: string;
  reportedUserRole: "student" | "client" | "user";
  reason: ReportReason;
  description: string;
};

export type ReportsResponse = {
  totalReports: number;
  reports: UserReport[];
};

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

const REPORT_REASONS: ReportReason[] = [
  "Scam / Fraud",
  "Fake Profile",
  "Harassment",
  "Spam",
  "Inappropriate Behavior",
  "Other",
];

let mockReports: UserReport[] = USER_REPORTS.map((report) => ({ ...report }));

const waitForMockApi = async () => {
  const delay = 300 + Math.floor(Math.random() * 501);
  await new Promise((resolve) => setTimeout(resolve, delay));
};

const createResponse = <T>(statusCode: number, data: T, message: string): ApiResponse<T> => ({
  statusCode,
  data,
  message,
  success: statusCode < 400,
});

const createMockError = (message: string, statusCode = 400) => {
  const error = new Error(message);

  return Object.assign(error, {
    statusCode,
    success: false,
    errors: [],
  });
};

const getInitials = (fullName = "") => {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatSubmittedDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const findMockUser = (
  id: string | undefined,
  name: string,
  role: SubmitReportPayload["reportedUserRole"]
) => {
  const normalizedName = name.trim().toLowerCase();

  const platformUser = PLATFORM_USERS.find(
    (user) =>
      (id && user.id === id) || (user.role === role && user.name.toLowerCase() === normalizedName)
  );

  if (platformUser) return platformUser;

  const studentVerification = VERIFICATION_REQUESTS.find(
    (user) =>
      role === "student" && ((id && user.id === id) || user.name.toLowerCase() === normalizedName)
  );

  if (studentVerification) {
    return {
      id: studentVerification.id,
      name: studentVerification.name,
      initials: studentVerification.initials,
      role: "student" as const,
    };
  }

  const clientVerification = CLIENT_KYC_REQUESTS.find(
    (user) =>
      role === "client" && ((id && user.id === id) || user.name.toLowerCase() === normalizedName)
  );

  if (clientVerification) {
    return {
      id: clientVerification.id,
      name: clientVerification.name,
      initials: clientVerification.initials,
      role: "client" as const,
    };
  }

  if (!name.trim() || role === "user") return null;

  return {
    id: id || `mock-${role}-${Date.now()}`,
    name: name.trim(),
    initials: getInitials(name),
    role,
  };
};

const getMockReporter = (reportedUserRole: "student" | "client") => {
  if (reportedUserRole === "student") {
    return {
      id: "u6",
      name: "Anil Chakraborty",
      initials: "AC",
      role: "client" as const,
    };
  }

  return {
    id: "u1",
    name: "Priya Sharma",
    initials: "PS",
    role: "student" as const,
  };
};

export const submitReport = async (
  payload: SubmitReportPayload
): Promise<ApiResponse<UserReport>> => {
  await waitForMockApi();

  if (payload.reportedUserRole === "user") {
    throw createMockError("Only students and clients can be reported.");
  }

  if (!REPORT_REASONS.includes(payload.reason)) {
    throw createMockError("Please select a valid report reason.");
  }

  if (!payload.description.trim()) {
    throw createMockError("Please describe the issue.");
  }

  if (payload.description.trim().length > 500) {
    throw createMockError("Report description cannot exceed 500 characters.");
  }

  const reportedUser = findMockUser(
    payload.reportedUserId,
    payload.reportedUserName,
    payload.reportedUserRole
  );

  if (!reportedUser) {
    throw createMockError("Reported user could not be found.", 404);
  }

  const reporter = getMockReporter(reportedUser.role);
  const newReport: UserReport = {
    id: `mock-report-${Date.now()}`,
    reporterUserId: reporter.id,
    reporterName: reporter.name,
    reporterInitials: reporter.initials,
    reporterRole: reporter.role,
    reportedUserId: reportedUser.id,
    reportedUserName: reportedUser.name,
    reportedUserRole: reportedUser.role,
    reason: payload.reason,
    description: payload.description.trim(),
    submittedAt: formatSubmittedDate(new Date()),
    status: "pending",
  };

  mockReports = [newReport, ...mockReports];

  return createResponse(201, newReport, "Report submitted successfully for admin review.");
};

export const getReports = async (): Promise<ApiResponse<ReportsResponse>> => {
  await waitForMockApi();

  return createResponse(
    200,
    {
      totalReports: mockReports.length,
      reports: mockReports.map((report) => ({ ...report })),
    },
    "Reports fetched successfully."
  );
};

export const getReportById = async (reportId: string): Promise<ApiResponse<UserReport>> => {
  await waitForMockApi();

  const report = mockReports.find((item) => item.id === reportId);

  if (!report) {
    throw createMockError("Report not found.", 404);
  }

  return createResponse(200, { ...report }, "Report fetched successfully.");
};

export const resolveReport = async (reportId: string): Promise<ApiResponse<UserReport>> => {
  await waitForMockApi();

  const report = mockReports.find((item) => item.id === reportId);

  if (!report) {
    throw createMockError("Report not found.", 404);
  }

  if (report.status !== "pending") {
    throw createMockError("Only pending reports can be resolved.");
  }

  const updatedReport = { ...report, status: "resolved" as ReportStatus };

  mockReports = mockReports.map((item) => (item.id === reportId ? updatedReport : item));

  return createResponse(200, updatedReport, "Report resolved successfully.");
};

export const dismissReport = async (reportId: string): Promise<ApiResponse<UserReport>> => {
  await waitForMockApi();

  const report = mockReports.find((item) => item.id === reportId);

  if (!report) {
    throw createMockError("Report not found.", 404);
  }

  if (report.status !== "pending") {
    throw createMockError("Only pending reports can be dismissed.");
  }

  const updatedReport = { ...report, status: "dismissed" as ReportStatus };

  mockReports = mockReports.map((item) => (item.id === reportId ? updatedReport : item));

  return createResponse(200, updatedReport, "Report dismissed successfully.");
};
