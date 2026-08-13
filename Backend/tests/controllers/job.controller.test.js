import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const applicationAggregateMock = jest.fn();
const jobCountDocumentsMock = jest.fn();
const jobCreateMock = jest.fn();
const jobFindMock = jest.fn();
const verificationFindMock = jest.fn();
const uploadAttachmentsMock = jest.fn();
const removeTempFilesMock = jest.fn();

jest.unstable_mockModule("../../src/models/application.model.js", () => ({
  Application: {
    aggregate: applicationAggregateMock,
  },
}));

jest.unstable_mockModule("../../src/models/job.model.js", () => ({
  Job: {
    countDocuments: jobCountDocumentsMock,
    create: jobCreateMock,
    find: jobFindMock,
  },
}));

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {},
}));

jest.unstable_mockModule("../../src/models/verification.model.js", () => ({
  Verification: {
    find: verificationFindMock,
  },
}));

jest.unstable_mockModule("../../src/utils/attachment.js", () => ({
  normalizeSubmittedAttachments: jest.fn((files = []) => files),
  uploadAttachments: uploadAttachmentsMock,
}));

jest.unstable_mockModule("../../src/utils/tempFile.js", () => ({
  removeTempFiles: removeTempFilesMock,
}));

jest.unstable_mockModule("../../src/services/client.service.js", () => ({
  buildClientSummary: jest.fn(),
}));

const { createJob, getClientJobs } =
  await import("../../src/controllers/job.controller.js");

const clientUser = {
  _id: "507f1f77bcf86cd799439011",
  role: "client",
};

const createVerificationQuery = (verifications) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(verifications),
});

const createJobFindQuery = (jobs) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(jobs),
});

describe("Job Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadAttachmentsMock.mockResolvedValue([]);
  });

  test("creates a job when the client is verified", async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 7);
    const createdJob = {
      _id: "job-1",
      title: "Build a landing page",
      status: "open",
    };

    verificationFindMock.mockReturnValue(
      createVerificationQuery([
        {
          user: clientUser._id,
          status: "approved",
        },
      ])
    );
    jobCreateMock.mockResolvedValue(createdJob);

    const { res, next } = await runController(createJob, {
      user: clientUser,
      files: [],
      body: {
        title: " Build a landing page ",
        category: "web-dev",
        description: "Create a polished landing page for a small business.",
        requirements: "Responsive design and contact form",
        skills: JSON.stringify(["React", "CSS"]),
        budget: "5000",
        duration: "7d",
        deadline: futureDeadline.toISOString(),
        complexity: "small",
      },
    });

    expect(verificationFindMock).toHaveBeenCalledWith({
      user: { $in: [clientUser._id] },
      type: "client",
    });
    expect(jobCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client: clientUser._id,
        title: "Build a landing page",
        category: "web-dev",
        skills: ["React", "CSS"],
        budget: 5000,
        status: "open",
      })
    );
    expect(removeTempFilesMock).toHaveBeenCalledWith([]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: createdJob,
        message: "Job created successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects job creation when client verification is not approved", async () => {
    verificationFindMock.mockReturnValue(
      createVerificationQuery([
        {
          user: clientUser._id,
          status: "pending",
        },
      ])
    );

    const { next } = await runController(createJob, {
      user: clientUser,
      files: [],
      body: {
        title: "Build app",
        category: "web-dev",
        description: "Create a polished landing page for a small business.",
        requirements: "Responsive design",
        budget: "5000",
        duration: "7d",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        complexity: "small",
      },
    });

    expect(jobCreateMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Profile verification is required before posting a job.",
      })
    );
  });

  test("returns client jobs with total and pending application counts", async () => {
    const jobs = [
      {
        _id: {
          toString: () => "job-1",
        },
        title: "Logo Design",
      },
    ];

    jobFindMock.mockReturnValue(createJobFindQuery(jobs));
    jobCountDocumentsMock.mockResolvedValue(1);
    applicationAggregateMock
      .mockResolvedValueOnce([
        {
          _id: jobs[0]._id,
          count: 3,
        },
      ])
      .mockResolvedValueOnce([
        {
          _id: jobs[0]._id,
          count: 1,
        },
      ]);

    const { res, next } = await runController(getClientJobs, {
      user: clientUser,
    });

    expect(jobFindMock).toHaveBeenCalledWith({ client: clientUser._id });
    expect(jobCountDocumentsMock).toHaveBeenCalledWith({
      client: clientUser._id,
    });
    expect(applicationAggregateMock).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            title: "Logo Design",
            applicationCount: 3,
            pendingApplicationCount: 1,
          }),
        ],
        message: "Client jobs fetched successfully",
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
