import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const userCountDocumentsMock = jest.fn();
const verificationFindMock = jest.fn();
const verificationCountDocumentsMock = jest.fn();
const projectCountDocumentsMock = jest.fn();

const createVerificationFindChain = (value) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

jest.unstable_mockModule("../../src/models/clientProfile.model.js", () => ({
  ClientProfile: {},
}));

jest.unstable_mockModule("../../src/models/job.model.js", () => ({
  Job: {},
}));

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {
    countDocuments: projectCountDocumentsMock,
  },
}));

jest.unstable_mockModule("../../src/models/report.model.js", () => ({
  Report: {},
}));

jest.unstable_mockModule("../../src/models/studentProfile.model.js", () => ({
  StudentProfile: {},
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User: {
    countDocuments: userCountDocumentsMock,
  },
}));

jest.unstable_mockModule("../../src/models/verification.model.js", () => ({
  Verification: {
    find: verificationFindMock,
    countDocuments: verificationCountDocumentsMock,
  },
}));

jest.unstable_mockModule("../../src/services/project.service.js", () => ({
  buildProfileSkillList: jest.fn((skills = [], verifiedSkills = []) => {
    const verifiedSet = new Set(
      verifiedSkills.map((skill) => skill.trim().toLowerCase())
    );

    return skills.map((skill) => ({
      name: skill,
      verified: verifiedSet.has(skill.trim().toLowerCase()),
    }));
  }),
  getStudentCompletedProjectProfileMap: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/review.service.js", () => ({
  getStudentReviewProfileMap: jest.fn(),
}));

const { getAdminDashboardSummaryData } =
  await import("../../src/services/admin.service.js");

describe("Admin Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns dashboard counts and latest pending verification tasks", async () => {
    const submittedAt = new Date("2026-07-20T00:00:00.000Z");
    const createdAt = new Date("2026-07-19T00:00:00.000Z");
    const verificationFindChain = createVerificationFindChain([
      {
        _id: { toString: () => "verification-1" },
        type: "student",
        submittedAt,
        createdAt,
        user: {
          fullName: "Priya Sharma",
          role: "student",
        },
      },
    ]);

    verificationFindMock.mockReturnValue(verificationFindChain);
    verificationCountDocumentsMock.mockResolvedValue(4);
    userCountDocumentsMock.mockResolvedValueOnce(12).mockResolvedValueOnce(7);
    projectCountDocumentsMock.mockResolvedValue(5);

    const summary = await getAdminDashboardSummaryData();

    expect(verificationFindMock).toHaveBeenCalledWith({ status: "pending" });
    expect(verificationFindChain.populate).toHaveBeenCalledWith(
      "user",
      "fullName avatar role"
    );
    expect(verificationFindChain.limit).toHaveBeenCalledWith(5);
    expect(verificationCountDocumentsMock).toHaveBeenCalledWith({
      status: "pending",
    });
    expect(userCountDocumentsMock).toHaveBeenNthCalledWith(1, {
      role: "student",
    });
    expect(userCountDocumentsMock).toHaveBeenNthCalledWith(2, {
      role: "client",
    });
    expect(projectCountDocumentsMock).toHaveBeenCalledWith({
      status: { $ne: "completed" },
    });
    expect(summary).toEqual({
      pendingVerifications: 4,
      totalStudents: 12,
      totalClients: 7,
      activeProjects: 5,
      pendingTasks: [
        {
          id: "verification-1",
          name: "Priya Sharma",
          initials: "PS",
          type: "student",
          text: "Priya Sharma submitted a student verification request",
          submittedAt,
          path: "/admin/students",
        },
      ],
    });
  });
});
