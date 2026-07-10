import { describe, expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {},
}));

jest.unstable_mockModule("../../src/models/review.model.js", () => ({
  Review: {},
}));

const { buildStudentReviewSummary } =
  await import("../../src/services/review.service.js");

describe("Review Service", () => {
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
});
