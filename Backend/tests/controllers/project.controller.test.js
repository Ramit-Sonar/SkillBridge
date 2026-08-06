import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const deliverableAggregateMock = jest.fn();
const deliverableCreateMock = jest.fn();
const projectFindMock = jest.fn();
const projectFindByIdMock = jest.fn();
const revisionAggregateMock = jest.fn();
const revisionCreateMock = jest.fn();
const revisionFindOneMock = jest.fn();
const uploadAttachmentsMock = jest.fn();
const removeTempFilesMock = jest.fn();
const getLatestDeliverableMock = jest.fn();
const getOpenRevisionMock = jest.fn();
const appendTimelineMock = jest.fn();
const updateProjectActivityMock = jest.fn();
const verifyStudentSkillsForCompletedProjectMock = jest.fn();
const buildProjectSummaryMock = jest.fn();
const buildSubmitDeliverableResponseMock = jest.fn();
const buildRequestRevisionResponseMock = jest.fn();
const buildApproveDeliverableResponseMock = jest.fn();
const endSessionMock = jest.fn();
const withTransactionMock = jest.fn();

const mongooseMock = {
  isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
  startSession: jest.fn(),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
}));

jest.unstable_mockModule("validator", () => ({
  default: {
    isURL: jest.fn(
      (value) => value.startsWith("http://") || value.startsWith("https://")
    ),
  },
}));

jest.unstable_mockModule("../../src/models/clientProfile.model.js", () => ({
  ClientProfile: {},
}));

jest.unstable_mockModule("../../src/models/deliverable.model.js", () => ({
  Deliverable: {
    aggregate: deliverableAggregateMock,
    create: deliverableCreateMock,
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {
    find: projectFindMock,
    findById: projectFindByIdMock,
  },
}));

jest.unstable_mockModule("../../src/models/review.model.js", () => ({
  Review: {
    exists: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/revision.model.js", () => ({
  Revision: {
    aggregate: revisionAggregateMock,
    create: revisionCreateMock,
    findOne: revisionFindOneMock,
  },
}));

jest.unstable_mockModule("../../src/models/studentProfile.model.js", () => ({
  StudentProfile: {},
}));

jest.unstable_mockModule("../../src/models/verification.model.js", () => ({
  Verification: {},
}));

jest.unstable_mockModule("../../src/services/project.service.js", () => ({
  appendTimeline: appendTimelineMock,
  getLatestDeliverable: getLatestDeliverableMock,
  getOpenRevision: getOpenRevisionMock,
  getStudentCompletedProjectProfileMap: jest.fn(),
  updateProjectActivity: updateProjectActivityMock,
  verifyStudentSkillsForCompletedProject:
    verifyStudentSkillsForCompletedProjectMock,
}));

jest.unstable_mockModule("../../src/services/review.service.js", () => ({
  getStudentReviewProfileMap: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/client.service.js", () => ({
  buildClientSummary: jest.fn(),
}));

jest.unstable_mockModule(
  "../../src/services/projectResponse.service.js",
  () => ({
    buildApproveDeliverableResponse: buildApproveDeliverableResponseMock,
    buildDeliverablesSummary: jest.fn(),
    buildProjectSummary: buildProjectSummaryMock,
    buildProjectTimeline: jest.fn(),
    buildProjectWorkspace: jest.fn(),
    buildRequestRevisionResponse: buildRequestRevisionResponseMock,
    buildRevisionSummary: jest.fn(),
    buildSubmitDeliverableResponse: buildSubmitDeliverableResponseMock,
  })
);

jest.unstable_mockModule("../../src/utils/attachment.js", () => ({
  deleteAttachments: jest.fn(),
  uploadAttachments: uploadAttachmentsMock,
}));

jest.unstable_mockModule("../../src/utils/tempFile.js", () => ({
  removeTempFiles: removeTempFilesMock,
}));

const {
  approveDeliverable,
  getMyProjects,
  requestRevision,
  submitDeliverable,
} = await import("../../src/controllers/project.controller.js");

const studentUser = {
  _id: "507f1f77bcf86cd799439011",
  role: "student",
};

const clientUser = {
  _id: "507f1f77bcf86cd799439012",
  role: "client",
};

const projectId = "507f1f77bcf86cd799439013";

const createProjectFindQuery = (projects) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(projects),
});

const createLeanQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const createSessionQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  session: jest.fn().mockResolvedValue(value),
});

const createRevisionNumberQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  session: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe("Project Controller", () => {
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

  test("returns project summaries for the logged-in student", async () => {
    const project = {
      _id: {
        toString: () => projectId,
      },
      status: "active",
    };
    const summary = {
      id: projectId,
      status: "active",
    };

    projectFindMock.mockReturnValue(createProjectFindQuery([project]));
    deliverableAggregateMock.mockResolvedValue([]);
    revisionAggregateMock.mockResolvedValue([]);
    buildProjectSummaryMock.mockReturnValue(summary);

    const { res, next } = await runController(getMyProjects, {
      user: studentUser,
    });

    expect(projectFindMock).toHaveBeenCalledWith({ student: studentUser._id });
    expect(buildProjectSummaryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        project,
        viewerRole: "student",
        latestSubmission: null,
        revisionCount: 0,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          totalProjects: 1,
          projects: [summary],
        },
        message: "Projects fetched successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("submits a deliverable and moves the project to submitted", async () => {
    const currentProject = {
      _id: projectId,
      student: studentUser._id,
      status: "active",
    };
    const deliverable = {
      _id: "deliverable-1",
      versionNumber: 1,
    };
    const responseData = {
      project: {
        id: projectId,
        status: "submitted",
      },
      latestSubmission: deliverable,
    };

    projectFindByIdMock
      .mockReturnValueOnce(createLeanQuery(currentProject))
      .mockReturnValueOnce(createSessionQuery(currentProject));
    getLatestDeliverableMock.mockResolvedValue(null);
    deliverableCreateMock.mockResolvedValue([deliverable]);
    appendTimelineMock.mockResolvedValue(currentProject);
    updateProjectActivityMock.mockResolvedValue({
      ...currentProject,
      status: "submitted",
    });
    buildSubmitDeliverableResponseMock.mockReturnValue(responseData);

    const { res, next } = await runController(submitDeliverable, {
      user: studentUser,
      files: [],
      params: {
        projectId,
      },
      body: {
        notes: "Initial delivery",
        demoLink: "https://example.com/demo",
      },
    });

    expect(deliverableCreateMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          project: projectId,
          versionNumber: 1,
          submittedBy: studentUser._id,
          notes: "Initial delivery",
          status: "submitted",
        }),
      ],
      expect.any(Object)
    );
    expect(updateProjectActivityMock).toHaveBeenCalledWith(
      currentProject,
      expect.objectContaining({
        status: "submitted",
      }),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: responseData,
        message: "Deliverable submitted successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("requests a revision for a submitted project", async () => {
    const currentProject = {
      _id: projectId,
      client: clientUser._id,
      status: "submitted",
    };
    const latestDeliverable = {
      _id: "deliverable-1",
      status: "submitted",
      versionNumber: 1,
    };
    const revision = {
      _id: "revision-1",
      revisionNumber: 1,
      message: "Please update spacing",
    };
    const responseData = {
      project: {
        id: projectId,
        status: "revision_requested",
      },
      revision,
    };

    projectFindByIdMock
      .mockReturnValueOnce(createLeanQuery(currentProject))
      .mockReturnValueOnce(createSessionQuery(currentProject));
    getLatestDeliverableMock.mockResolvedValue(latestDeliverable);
    revisionFindOneMock.mockReturnValue(createRevisionNumberQuery(null));
    revisionCreateMock.mockResolvedValue([revision]);
    updateProjectActivityMock.mockResolvedValue({
      ...currentProject,
      status: "revision_requested",
    });
    appendTimelineMock.mockResolvedValue({
      ...currentProject,
      status: "revision_requested",
    });
    buildRequestRevisionResponseMock.mockReturnValue(responseData);

    const { res, next } = await runController(requestRevision, {
      user: clientUser,
      files: [],
      params: {
        projectId,
      },
      body: {
        message: " Please update spacing ",
        referenceLinks: "https://example.com/reference",
      },
    });

    expect(revisionCreateMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          project: projectId,
          deliverable: latestDeliverable._id,
          revisionNumber: 1,
          requestedBy: clientUser._id,
          message: "Please update spacing",
          referenceLinks: ["https://example.com/reference"],
        }),
      ],
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: responseData,
        message: "Revision requested successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("approves a submitted deliverable and completes the project", async () => {
    const currentProject = {
      _id: projectId,
      client: clientUser._id,
      student: studentUser._id,
      status: "submitted",
    };
    const latestDeliverable = {
      _id: "deliverable-1",
      versionNumber: 2,
      status: "submitted",
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(),
    };
    const completedProject = {
      ...currentProject,
      status: "completed",
    };
    const responseData = {
      project: {
        id: projectId,
        status: "completed",
      },
    };

    projectFindByIdMock
      .mockReturnValueOnce(createLeanQuery(currentProject))
      .mockReturnValueOnce(createSessionQuery(currentProject));
    getLatestDeliverableMock.mockResolvedValue(latestDeliverable);
    updateProjectActivityMock.mockResolvedValue(completedProject);
    appendTimelineMock.mockResolvedValue(completedProject);
    verifyStudentSkillsForCompletedProjectMock.mockResolvedValue([]);
    buildApproveDeliverableResponseMock.mockReturnValue(responseData);

    const { res, next } = await runController(approveDeliverable, {
      user: clientUser,
      params: {
        projectId,
      },
    });

    expect(latestDeliverable.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        approvedBy: clientUser._id,
      })
    );
    expect(verifyStudentSkillsForCompletedProjectMock).toHaveBeenCalledWith({
      project: completedProject,
      session: expect.any(Object),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: responseData,
        message: "Deliverable approved successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
