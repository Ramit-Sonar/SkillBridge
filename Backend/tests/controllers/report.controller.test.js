import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const reportCreateMock = jest.fn();
const reportFindByIdMock = jest.fn();
const userFindByIdMock = jest.fn();
const uploadAttachmentsMock = jest.fn();
const buildReportSummaryMock = jest.fn();
const removeTempFilesMock = jest.fn();

const mongooseMock = {
  isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
}));

jest.unstable_mockModule("../../src/models/report.model.js", () => ({
  REPORT_REASONS: ["Spam", "Harassment", "Other"],
  REPORT_STATUSES: ["open", "resolved", "dismissed"],
  Report: {
    create: reportCreateMock,
    find: jest.fn(),
    findById: reportFindByIdMock,
  },
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User: {
    find: jest.fn(),
    findById: userFindByIdMock,
  },
}));

jest.unstable_mockModule("../../src/services/report.service.js", () => ({
  buildReportSummary: buildReportSummaryMock,
  getReportedUserDetailsData: jest.fn(),
}));

jest.unstable_mockModule("../../src/utils/attachment.js", () => ({
  deleteAttachments: jest.fn(),
  uploadAttachments: uploadAttachmentsMock,
}));

jest.unstable_mockModule("../../src/utils/tempFile.js", () => ({
  removeTempFiles: removeTempFilesMock,
}));

const { createReport, resolveReport } =
  await import("../../src/controllers/report.controller.js");

const reporter = {
  _id: "507f1f77bcf86cd799439011",
  role: "student",
};

const reportedUserId = "507f1f77bcf86cd799439012";
const reportId = "507f1f77bcf86cd799439013";

const createSelectQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const createPopulateQuery = (value) => ({
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe("Report Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadAttachmentsMock.mockResolvedValue([]);
  });

  test("creates a report against another student or client", async () => {
    const report = {
      _id: reportId,
      reason: "Spam",
    };
    const reportSummary = {
      id: reportId,
      reason: "Spam",
      status: "open",
    };

    userFindByIdMock.mockReturnValue(
      createSelectQuery({
        _id: reportedUserId,
        role: "client",
      })
    );
    reportCreateMock.mockResolvedValue(report);
    reportFindByIdMock.mockReturnValue(createPopulateQuery(report));
    buildReportSummaryMock.mockReturnValue(reportSummary);

    const { res, next } = await runController(createReport, {
      user: reporter,
      files: [],
      body: {
        reportedUserId,
        reason: "Spam",
        description: "This account is posting fake jobs.",
      },
    });

    expect(reportCreateMock).toHaveBeenCalledWith({
      reporter: reporter._id,
      reportedUser: reportedUserId,
      reason: "Spam",
      description: "This account is posting fake jobs.",
      attachments: [],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: reportSummary,
        message: "Report submitted successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("resolves an open report as admin action", async () => {
    const saveMock = jest.fn().mockResolvedValue();
    const report = {
      _id: reportId,
      status: "open",
      save: saveMock,
    };
    const reportSummary = {
      id: reportId,
      status: "resolved",
    };

    reportFindByIdMock
      .mockResolvedValueOnce(report)
      .mockReturnValueOnce(createPopulateQuery(report));
    buildReportSummaryMock.mockReturnValue(reportSummary);

    const { res, next } = await runController(resolveReport, {
      user: {
        _id: "507f1f77bcf86cd799439014",
        role: "admin",
      },
      params: {
        reportId,
      },
    });

    expect(report.status).toBe("resolved");
    expect(report.handledBy).toBe("507f1f77bcf86cd799439014");
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: reportSummary,
        message: "Report resolved successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
