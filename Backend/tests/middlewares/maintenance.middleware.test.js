import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { createMockResponse } from "../setup/testHelpers.js";

const platformSettingsFindOneMock = jest.fn();

jest.unstable_mockModule("../../src/models/platformSettings.model.js", () => ({
  PlatformSettings: {
    findOne: platformSettingsFindOneMock,
  },
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User: {},
}));

const { maintenanceModeMiddleware } =
  await import("../../src/middlewares/maintenance.middleware.js");

const runMiddleware = async (req) => {
  const res = createMockResponse();
  const next = jest.fn();

  maintenanceModeMiddleware(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));

  return { res, next };
};

const createSettingsQuery = (settings) => ({
  lean: jest.fn().mockResolvedValue(settings),
});

describe("maintenanceModeMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("allows requests when maintenance mode is disabled", async () => {
    platformSettingsFindOneMock.mockReturnValue(
      createSettingsQuery({
        maintenanceMode: false,
      })
    );

    const { res, next } = await runMiddleware({
      originalUrl: "/api/v1/jobs",
      method: "GET",
      cookies: {},
      body: {},
      header: jest.fn(),
    });

    expect(platformSettingsFindOneMock).toHaveBeenCalledWith({
      key: "platform",
    });
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("blocks non-admin API requests during maintenance", async () => {
    platformSettingsFindOneMock.mockReturnValue(
      createSettingsQuery({
        maintenanceMode: true,
        platformName: "SkillBridge",
        maintenanceMessage: "Deploying updates.",
        supportEmail: "support@example.com",
        platformDescription: "Student-client marketplace",
      })
    );

    const { res, next } = await runMiddleware({
      originalUrl: "/api/v1/jobs",
      method: "GET",
      cookies: {},
      body: {},
      header: jest.fn(),
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 503,
      success: false,
      code: "MAINTENANCE_MODE",
      errorCode: "MAINTENANCE_MODE",
      message: "Deploying updates.",
      errors: [],
      authenticated: false,
      platformName: "SkillBridge",
      supportEmail: "support@example.com",
      platformDescription: "Student-client marketplace",
      maintenanceMessage: "Deploying updates.",
    });
  });

  test("allows admin login during maintenance", async () => {
    platformSettingsFindOneMock.mockReturnValue(
      createSettingsQuery({
        maintenanceMode: true,
        platformName: "SkillBridge",
      })
    );

    const { res, next } = await runMiddleware({
      originalUrl: "/api/v1/users/login",
      method: "POST",
      cookies: {},
      body: {
        loginType: "admin",
      },
      header: jest.fn(),
    });

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
