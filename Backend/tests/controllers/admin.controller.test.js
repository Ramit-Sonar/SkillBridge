import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const getAdminDashboardSummaryDataMock = jest.fn();
const updateAdminUserAccountStatusMock = jest.fn();

const mongooseMock = {
  isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
}));

jest.unstable_mockModule("../../src/services/admin.service.js", () => ({
  getAdminDashboardSummaryData: getAdminDashboardSummaryDataMock,
  getAdminJobDetailsData: jest.fn(),
  getAdminJobsData: jest.fn(),
  getAdminUserDetailsData: jest.fn(),
  getAdminUsersData: jest.fn(),
  getPlatformSettingsData: jest.fn(),
  suspendAdminJobData: jest.fn(),
  updateAdminUserAccountStatus: updateAdminUserAccountStatusMock,
  updateGeneralSettingsData: jest.fn(),
  updateMaintenanceSettingsData: jest.fn(),
}));

const { getAdminDashboardSummary, suspendAdminUser } =
  await import("../../src/controllers/admin.controller.js");

describe("Admin Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns admin dashboard summary", async () => {
    const summary = {
      pendingVerifications: 2,
      totalStudents: 10,
      totalClients: 4,
      activeProjects: 3,
      pendingTasks: [],
    };
    getAdminDashboardSummaryDataMock.mockResolvedValue(summary);

    const { res, next } = await runController(getAdminDashboardSummary);

    expect(getAdminDashboardSummaryDataMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: summary,
        message: "Admin dashboard fetched successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("suspends a user through the admin account status service", async () => {
    const adminUserId = "507f1f77bcf86cd799439011";
    const userId = "507f1f77bcf86cd799439012";
    const suspendedUser = {
      id: userId,
      accountStatus: "suspended",
    };
    updateAdminUserAccountStatusMock.mockResolvedValue(suspendedUser);

    const { res, next } = await runController(suspendAdminUser, {
      user: {
        _id: adminUserId,
      },
      params: {
        userId,
      },
      body: {
        suspensionReason: " Policy violation ",
      },
    });

    expect(updateAdminUserAccountStatusMock).toHaveBeenCalledWith(
      userId,
      "suspended",
      adminUserId,
      "Policy violation"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: suspendedUser,
        message: "User suspended successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
