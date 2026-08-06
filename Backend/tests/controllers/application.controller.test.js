import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const applicationCreateMock = jest.fn();
const applicationExistsMock = jest.fn();
const applicationFindByIdMock = jest.fn();
const applicationFindOneAndUpdateMock = jest.fn();
const applicationUpdateManyMock = jest.fn();
const jobFindByIdMock = jest.fn();
const jobFindOneAndUpdateMock = jest.fn();
const verificationFindOneMock = jest.fn();
const uploadAttachmentsMock = jest.fn();
const removeTempFilesMock = jest.fn();
const createProjectFromAcceptedApplicationMock = jest.fn();
const endSessionMock = jest.fn();
const withTransactionMock = jest.fn();

const mongooseMock = {
  isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
  startSession: jest.fn(),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
}));

jest.unstable_mockModule("../../src/models/application.model.js", () => ({
  Application: {
    create: applicationCreateMock,
    exists: applicationExistsMock,
    findById: applicationFindByIdMock,
    findOneAndUpdate: applicationFindOneAndUpdateMock,
    updateMany: applicationUpdateManyMock,
  },
}));

jest.unstable_mockModule("../../src/models/job.model.js", () => ({
  Job: {
    findById: jobFindByIdMock,
    findOneAndUpdate: jobFindOneAndUpdateMock,
  },
}));

jest.unstable_mockModule("../../src/models/studentProfile.model.js", () => ({
  StudentProfile: {},
}));

jest.unstable_mockModule("../../src/models/verification.model.js", () => ({
  Verification: {
    findOne: verificationFindOneMock,
  },
}));

jest.unstable_mockModule("../../src/services/application.service.js", () => ({
  buildApplicantSummary: jest.fn(),
  buildApplicationDetails: jest.fn(),
  buildApplicationSummary: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/client.service.js", () => ({
  buildClientSummary: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/project.service.js", () => ({
  createProjectFromAcceptedApplication:
    createProjectFromAcceptedApplicationMock,
  getStudentCompletedProjectProfileMap: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/review.service.js", () => ({
  getStudentReviewProfileMap: jest.fn(),
}));

jest.unstable_mockModule("../../src/utils/attachment.js", () => ({
  deleteAttachments: jest.fn(),
  uploadAttachments: uploadAttachmentsMock,
}));

jest.unstable_mockModule("../../src/utils/tempFile.js", () => ({
  removeTempFiles: removeTempFilesMock,
}));

const { acceptApplication, submitApplication, withdrawApplication } =
  await import("../../src/controllers/application.controller.js");

const studentUser = {
  _id: "507f1f77bcf86cd799439011",
  role: "student",
};

const clientUser = {
  _id: "507f1f77bcf86cd799439012",
  role: "client",
};

const jobId = "507f1f77bcf86cd799439013";
const applicationId = "507f1f77bcf86cd799439014";

const createSelectQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const createSessionSelectQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  session: jest.fn().mockResolvedValue(value),
});

const createUpdateSelectQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

describe("Application Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadAttachmentsMock.mockResolvedValue([]);
    withTransactionMock.mockImplementation(async (callback) => callback());
    endSessionMock.mockResolvedValue();
    mongooseMock.startSession.mockResolvedValue({
      withTransaction: withTransactionMock,
      endSession: endSessionMock,
    });
  });

  test("submits an application for a verified student and open job", async () => {
    const createdApplication = {
      _id: applicationId,
      job: jobId,
      status: "pending",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
    };

    verificationFindOneMock.mockReturnValue(
      createSelectQuery({ status: "approved" })
    );
    jobFindByIdMock.mockReturnValue(
      createSelectQuery({
        client: clientUser._id,
        status: "open",
      })
    );
    applicationExistsMock.mockResolvedValue(null);
    applicationCreateMock.mockResolvedValue(createdApplication);

    const { res, next } = await runController(submitApplication, {
      user: studentUser,
      files: [],
      params: {
        jobId,
      },
      body: {
        coverLetter: "I can build this.",
        estimatedCompletionTime: "7 days",
        whySuitable: "I have relevant experience.",
      },
    });

    expect(verificationFindOneMock).toHaveBeenCalledWith({
      user: studentUser._id,
      type: "student",
    });
    expect(applicationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        job: jobId,
        student: studentUser._id,
        status: "pending",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId,
          jobId,
          status: "pending",
        }),
        message: "Application submitted successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("withdraws a pending student application", async () => {
    const application = {
      _id: applicationId,
      student: studentUser._id,
      status: "pending",
    };
    const withdrawnApplication = {
      _id: applicationId,
      status: "withdrawn",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      withdrawnAt: new Date("2026-08-02T00:00:00.000Z"),
      updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    };

    applicationFindByIdMock.mockReturnValue(createSelectQuery(application));
    applicationFindOneAndUpdateMock.mockReturnValue(
      createUpdateSelectQuery(withdrawnApplication)
    );

    const { res, next } = await runController(withdrawApplication, {
      user: studentUser,
      params: {
        applicationId,
      },
    });

    expect(applicationFindOneAndUpdateMock).toHaveBeenCalledWith(
      {
        _id: applicationId,
        status: "pending",
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "withdrawn",
        }),
      }),
      { returnDocument: "after" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId,
          status: "withdrawn",
        }),
        message: "Application withdrawn successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("accepts an application, rejects other pending applications, closes job, and creates project", async () => {
    const application = {
      _id: applicationId,
      job: jobId,
      status: "pending",
    };
    const job = {
      _id: jobId,
      client: clientUser._id,
      status: "open",
    };
    const acceptedApplication = {
      _id: applicationId,
      job: jobId,
      student: studentUser._id,
      status: "accepted",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      acceptedAt: new Date("2026-08-02T00:00:00.000Z"),
      updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    };
    const closedJob = {
      _id: jobId,
      status: "closed",
    };
    const project = {
      _id: "507f1f77bcf86cd799439015",
      status: "active",
      startedAt: new Date("2026-08-02T00:00:00.000Z"),
    };

    applicationFindByIdMock.mockReturnValue(
      createSessionSelectQuery(application)
    );
    jobFindByIdMock.mockReturnValue(createSessionSelectQuery(job));
    applicationFindOneAndUpdateMock.mockReturnValue(
      createUpdateSelectQuery(acceptedApplication)
    );
    applicationUpdateManyMock.mockResolvedValue({ modifiedCount: 2 });
    jobFindOneAndUpdateMock.mockReturnValue(createUpdateSelectQuery(closedJob));
    createProjectFromAcceptedApplicationMock.mockResolvedValue(project);

    const { res, next } = await runController(acceptApplication, {
      user: clientUser,
      params: {
        applicationId,
      },
    });

    expect(withTransactionMock).toHaveBeenCalled();
    expect(applicationUpdateManyMock).toHaveBeenCalledWith(
      {
        job: jobId,
        _id: { $ne: applicationId },
        status: "pending",
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "rejected",
        }),
      }),
      expect.any(Object)
    );
    expect(createProjectFromAcceptedApplicationMock).toHaveBeenCalledWith({
      application: acceptedApplication,
      job,
      session: expect.any(Object),
    });
    expect(endSessionMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId,
          status: "accepted",
          rejectedApplicationsCount: 2,
          job: {
            jobId,
            status: "closed",
          },
          project: {
            projectId: project._id,
            status: "active",
            startedAt: project.startedAt,
          },
        }),
        message: "Application accepted successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
