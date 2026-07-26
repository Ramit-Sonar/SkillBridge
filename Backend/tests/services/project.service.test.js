import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const jobFindByIdMock = jest.fn();
const projectFindMock = jest.fn();
const studentProfileFindOneMock = jest.fn();

const createJobQuery = (job) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(job),
});

const createCompletedProjectsQuery = (projects) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(projects),
});

jest.unstable_mockModule("../../src/models/deliverable.model.js", () => ({
  Deliverable: {},
}));

jest.unstable_mockModule("../../src/models/job.model.js", () => ({
  Job: {
    findById: jobFindByIdMock,
  },
}));

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {
    find: projectFindMock,
  },
}));

jest.unstable_mockModule("../../src/models/revision.model.js", () => ({
  Revision: {},
}));

jest.unstable_mockModule("../../src/models/studentProfile.model.js", () => ({
  StudentProfile: {
    findOne: studentProfileFindOneMock,
  },
}));

const {
  SKILL_VERIFICATION_THRESHOLD,
  verifyStudentSkillsForCompletedProject,
} = await import("../../src/services/project.service.js");

describe("Project Service skill verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses one configurable verification threshold", () => {
    expect(SKILL_VERIFICATION_THRESHOLD).toBe(1);
  });

  test("verifies only matching student skills after a completed approved project", async () => {
    const saveMock = jest.fn();
    const studentProfile = {
      skills: ["React", "Node.js"],
      verifiedSkills: [],
      save: saveMock,
    };

    studentProfileFindOneMock.mockReturnValue(studentProfile);
    jobFindByIdMock.mockReturnValue(
      createJobQuery({ skills: ["React", "MongoDB"] })
    );
    projectFindMock.mockReturnValue(
      createCompletedProjectsQuery([
        { job: { skills: ["React", "MongoDB"] } },
        { job: { skills: ["Node.js"] } },
      ])
    );

    const verifiedSkills = await verifyStudentSkillsForCompletedProject({
      project: { student: "student-1", job: "job-1" },
    });

    expect(verifiedSkills).toEqual(["React"]);
    expect(studentProfile.verifiedSkills).toEqual(["React"]);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  test("skips skills that are already verified", async () => {
    const saveMock = jest.fn();

    studentProfileFindOneMock.mockReturnValue({
      skills: ["React"],
      verifiedSkills: ["React"],
      save: saveMock,
    });
    jobFindByIdMock.mockReturnValue(createJobQuery({ skills: ["React"] }));

    const verifiedSkills = await verifyStudentSkillsForCompletedProject({
      project: { student: "student-1", job: "job-1" },
    });

    expect(verifiedSkills).toEqual([]);
    expect(projectFindMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });
});
