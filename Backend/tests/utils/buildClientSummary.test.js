import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockSelect = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const findByIdMock = jest.fn();
const findOneMock = jest.fn();
const countDocumentsMock = jest.fn();

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User: {
    findById: findByIdMock,
  },
}));

jest.unstable_mockModule("../../src/models/clientProfile.model.js", () => ({
  ClientProfile: {
    findOne: findOneMock,
  },
}));

jest.unstable_mockModule("../../src/models/job.model.js", () => ({
  Job: {
    countDocuments: countDocumentsMock,
  },
}));

const { buildClientSummary } = await import("../../src/utils/buildClientSummary.js");

describe("buildClientSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns one complete client summary from user, profile, and job count", async () => {
    const userId = "client-user-id";
    const createdAt = new Date("2026-06-15T00:00:00.000Z");

    findByIdMock.mockReturnValue(
      mockSelect({
        _id: { toString: () => userId },
        fullName: "Dikshya Khanal",
        avatar: "https://example.com/avatar.png",
        createdAt,
      })
    );
    findOneMock.mockReturnValue(
      mockSelect({
        location: "Kathmandu, Nepal",
        companyName: "TechNova Pvt. Ltd.",
        website: "technova.example",
        bio: "We build useful software products.",
      })
    );
    countDocumentsMock.mockResolvedValue(8);

    const summary = await buildClientSummary(userId);

    expect(findByIdMock).toHaveBeenCalledWith(userId);
    expect(findOneMock).toHaveBeenCalledWith({ user: userId });
    expect(countDocumentsMock).toHaveBeenCalledWith({ client: userId });
    expect(summary).toEqual({
      id: userId,
      fullName: "Dikshya Khanal",
      avatar: "https://example.com/avatar.png",
      joined: createdAt,
      location: "Kathmandu, Nepal",
      companyName: "TechNova Pvt. Ltd.",
      website: "technova.example",
      bio: "We build useful software products.",
      verification: {
        status: null,
        verifiedAt: null,
      },
      statistics: {
        jobsPosted: 8,
        projectsCompleted: null,
        activeProjects: null,
        totalReviews: null,
        averageRating: null,
      },
    });
  });
});
