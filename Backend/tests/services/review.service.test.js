import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const aggregateMock = jest.fn();

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {},
}));

jest.unstable_mockModule("../../src/models/review.model.js", () => ({
  Review: {
    aggregate: aggregateMock,
  },
}));

const { buildStudentReviewSummary, getStudentRatingSummary } =
  await import("../../src/services/review.service.js");

describe("Review Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("builds a student review summary without unnecessary fields", () => {
    const review = {
      _id: "review-1",
      rating: 5,
      comment: "Excellent work",
      createdAt: new Date("2026-07-10T00:00:00.000Z"),
      student: "student-1",
      application: "application-1",
      timeline: [],
      client: {
        _id: "client-1",
        fullName: "Dikshya Khanal",
        avatar: "https://example.com/avatar.png",
        email: "client@example.com",
        password: "hidden",
      },
      project: {
        _id: "project-1",
        completedAt: new Date("2026-07-09T00:00:00.000Z"),
        application: "application-1",
        timeline: [],
        job: {
          _id: "job-1",
          title: "Build Portfolio Website",
          category: "web-dev",
          budget: 5000,
        },
      },
    };

    expect(buildStudentReviewSummary(review)).toEqual({
      reviewId: "review-1",
      rating: 5,
      comment: "Excellent work",
      createdAt: review.createdAt,
      client: {
        _id: "client-1",
        fullName: "Dikshya Khanal",
        avatar: "https://example.com/avatar.png",
      },
      project: {
        _id: "project-1",
        completedAt: review.project.completedAt,
        job: {
          _id: "job-1",
          title: "Build Portfolio Website",
          category: "web-dev",
        },
      },
    });
  });

  test("returns rating summary for multiple reviews", async () => {
    aggregateMock.mockResolvedValue([
      {
        _id: "507f1f77bcf86cd799439012",
        averageRating: 4.333333333,
        reviewCount: 3,
        oneStar: 0,
        twoStar: 0,
        threeStar: 1,
        fourStar: 0,
        fiveStar: 2,
      },
    ]);

    const summary = await getStudentRatingSummary("507f1f77bcf86cd799439012");

    expect(aggregateMock).toHaveBeenCalledTimes(1);
    expect(aggregateMock.mock.calls[0][0]).toEqual([
      {
        $match: {
          student: expect.any(Object),
        },
      },
      {
        $group: expect.objectContaining({
          _id: "$student",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        }),
      },
    ]);
    expect(summary).toEqual({
      averageRating: 4.3,
      reviewCount: 3,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 1,
        4: 0,
        5: 2,
      },
    });
  });

  test("returns rating summary for one review", async () => {
    aggregateMock.mockResolvedValue([
      {
        _id: "507f1f77bcf86cd799439012",
        averageRating: 5,
        reviewCount: 1,
        oneStar: 0,
        twoStar: 0,
        threeStar: 0,
        fourStar: 0,
        fiveStar: 1,
      },
    ]);

    await expect(
      getStudentRatingSummary("507f1f77bcf86cd799439012")
    ).resolves.toEqual({
      averageRating: 5,
      reviewCount: 1,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 1,
      },
    });
  });

  test("returns zero values when the student has no reviews", async () => {
    aggregateMock.mockResolvedValue([]);

    await expect(
      getStudentRatingSummary("507f1f77bcf86cd799439012")
    ).resolves.toEqual({
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    });
  });
});
