import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ApiError } from "../../src/utils/ApiError.js";
import { runController } from "../setup/testHelpers.js";

const createReviewMock = jest.fn();
const findReviewsMock = jest.fn();
const canReviewProjectMock = jest.fn();
const buildReviewSummaryMock = jest.fn();
const buildStudentReviewSummaryMock = jest.fn();

jest.unstable_mockModule("../../src/models/review.model.js", () => ({
  Review: {
    create: createReviewMock,
    find: findReviewsMock,
  },
}));

jest.unstable_mockModule("../../src/services/review.service.js", () => ({
  canReviewProject: canReviewProjectMock,
  buildReviewSummary: buildReviewSummaryMock,
  buildStudentReviewSummary: buildStudentReviewSummaryMock,
}));

const { createReview, getStudentReviews } =
  await import("../../src/controllers/review.controller.js");

const clientUser = {
  _id: "507f1f77bcf86cd799439011",
  role: "client",
};

const studentUser = {
  _id: "507f1f77bcf86cd799439012",
  role: "student",
};

const completedProject = {
  _id: "507f1f77bcf86cd799439013",
  student: "507f1f77bcf86cd799439014",
  client: clientUser._id,
  status: "completed",
};

describe("Review Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects unauthenticated users", async () => {
    const { next } = await runController(createReview, {
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 5,
      },
    });

    expect(canReviewProjectMock).not.toHaveBeenCalled();
    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "User not authenticated",
      })
    );
  });

  test("creates a review for a completed project assigned to the client", async () => {
    const createdReview = {
      _id: "review-1",
      project: completedProject._id,
      student: completedProject.student,
      client: clientUser._id,
      rating: 5,
      comment: "Excellent work",
      editedAt: null,
      createdAt: new Date("2026-07-10T00:00:00.000Z"),
      updatedAt: new Date("2026-07-10T00:00:00.000Z"),
    };
    const reviewSummary = {
      reviewId: createdReview._id,
      projectId: createdReview.project,
      studentId: createdReview.student,
      clientId: createdReview.client,
      rating: createdReview.rating,
      comment: createdReview.comment,
      editedAt: createdReview.editedAt,
      createdAt: createdReview.createdAt,
      updatedAt: createdReview.updatedAt,
    };

    canReviewProjectMock.mockResolvedValue(completedProject);
    createReviewMock.mockResolvedValue(createdReview);
    buildReviewSummaryMock.mockReturnValue(reviewSummary);

    const { res, next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 5,
        comment: " Excellent work ",
      },
    });

    expect(canReviewProjectMock).toHaveBeenCalledWith(
      completedProject._id,
      clientUser._id
    );
    expect(createReviewMock).toHaveBeenCalledWith({
      project: completedProject._id,
      student: completedProject.student,
      client: clientUser._id,
      rating: 5,
      comment: "Excellent work",
    });
    expect(buildReviewSummaryMock).toHaveBeenCalledWith(createdReview);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 201,
        data: reviewSummary,
        message: "Review created successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects duplicate reviews for the same project", async () => {
    canReviewProjectMock.mockRejectedValue(
      new ApiError(409, "This project has already been reviewed")
    );

    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 4,
      },
    });

    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: "This project has already been reviewed",
      })
    );
  });

  test("rejects duplicate reviews caught by the unique project index", async () => {
    const duplicateError = new Error("Duplicate key");
    duplicateError.code = 11000;

    canReviewProjectMock.mockResolvedValue(completedProject);
    createReviewMock.mockRejectedValue(duplicateError);

    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 4,
      },
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: "This project has already been reviewed",
      })
    );
  });

  test("rejects students attempting to create reviews", async () => {
    const { next } = await runController(createReview, {
      user: studentUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 5,
      },
    });

    expect(canReviewProjectMock).not.toHaveBeenCalled();
    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Only clients can create reviews",
      })
    );
  });

  test("rejects different clients attempting to review a project", async () => {
    canReviewProjectMock.mockRejectedValue(
      new ApiError(403, "You can review only your own project")
    );

    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 5,
      },
    });

    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "You can review only your own project",
      })
    );
  });

  test("rejects projects that are not completed", async () => {
    canReviewProjectMock.mockRejectedValue(
      new ApiError(400, "Only completed projects can be reviewed")
    );

    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 5,
      },
    });

    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Only completed projects can be reviewed",
      })
    );
  });

  test("rejects invalid project ids", async () => {
    canReviewProjectMock.mockRejectedValue(
      new ApiError(400, "Invalid project id")
    );

    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: "invalid-project-id",
      },
      body: {
        rating: 5,
      },
    });

    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Invalid project id",
      })
    );
  });

  test("rejects missing projects", async () => {
    canReviewProjectMock.mockRejectedValue(
      new ApiError(404, "Project not found")
    );

    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 5,
      },
    });

    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "Project not found",
      })
    );
  });

  test("rejects ratings outside 1 to 5", async () => {
    const { next } = await runController(createReview, {
      user: clientUser,
      params: {
        projectId: completedProject._id,
      },
      body: {
        rating: 6,
      },
    });

    expect(canReviewProjectMock).not.toHaveBeenCalled();
    expect(createReviewMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Rating must be a number between 1 and 5",
      })
    );
  });

  test("returns the logged-in student's reviews newest first", async () => {
    const reviews = [
      {
        _id: "review-2",
        rating: 5,
        comment: "Great final delivery",
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        client: {
          _id: "client-2",
          fullName: "Aarya Shrestha",
          avatar: "https://example.com/client-2.png",
        },
        project: {
          _id: "project-2",
          completedAt: new Date("2026-07-09T00:00:00.000Z"),
          job: {
            _id: "job-2",
            title: "Build Portfolio Website",
            category: "web-dev",
          },
        },
      },
      {
        _id: "review-1",
        rating: 4,
        comment: "Good communication",
        createdAt: new Date("2026-07-08T00:00:00.000Z"),
        client: {
          _id: "client-1",
          fullName: "Dikshya Khanal",
          avatar: "",
        },
        project: {
          _id: "project-1",
          completedAt: new Date("2026-07-07T00:00:00.000Z"),
          job: {
            _id: "job-1",
            title: "UI Refresh",
            category: "ui-ux",
          },
        },
      },
    ];
    const reviewSummaries = [
      {
        reviewId: "review-2",
        rating: 5,
        comment: "Great final delivery",
        createdAt: reviews[0].createdAt,
        client: reviews[0].client,
        project: reviews[0].project,
      },
      {
        reviewId: "review-1",
        rating: 4,
        comment: "Good communication",
        createdAt: reviews[1].createdAt,
        client: reviews[1].client,
        project: reviews[1].project,
      },
    ];
    const leanMock = jest.fn().mockResolvedValue(reviews);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
    const firstPopulateMock = jest
      .fn()
      .mockReturnValue({ populate: secondPopulateMock });
    const selectMock = jest.fn().mockReturnValue({
      populate: firstPopulateMock,
    });

    findReviewsMock.mockReturnValue({ select: selectMock });
    buildStudentReviewSummaryMock
      .mockReturnValueOnce(reviewSummaries[0])
      .mockReturnValueOnce(reviewSummaries[1]);

    const { res, next } = await runController(getStudentReviews, {
      user: studentUser,
    });

    expect(findReviewsMock).toHaveBeenCalledWith({ student: studentUser._id });
    expect(selectMock).toHaveBeenCalledWith(
      "_id project client rating comment createdAt"
    );
    expect(firstPopulateMock).toHaveBeenCalledWith({
      path: "client",
      select: "_id fullName avatar",
    });
    expect(secondPopulateMock).toHaveBeenCalledWith({
      path: "project",
      select: "_id job completedAt",
      populate: {
        path: "job",
        select: "_id title category",
      },
    });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(leanMock).toHaveBeenCalled();
    expect(buildStudentReviewSummaryMock).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        data: {
          reviews: reviewSummaries,
        },
        message: "Student reviews fetched successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("returns an empty review list when the student has no reviews", async () => {
    const leanMock = jest.fn().mockResolvedValue([]);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
    const firstPopulateMock = jest
      .fn()
      .mockReturnValue({ populate: secondPopulateMock });
    const selectMock = jest.fn().mockReturnValue({
      populate: firstPopulateMock,
    });

    findReviewsMock.mockReturnValue({ select: selectMock });

    const { res, next } = await runController(getStudentReviews, {
      user: studentUser,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        data: {
          reviews: [],
        },
        message: "Student reviews fetched successfully",
      })
    );
    expect(buildStudentReviewSummaryMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects clients viewing student reviews", async () => {
    const { next } = await runController(getStudentReviews, {
      user: clientUser,
    });

    expect(findReviewsMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Only students can view their reviews",
      })
    );
  });

  test("rejects unauthenticated users viewing student reviews", async () => {
    const { next } = await runController(getStudentReviews);

    expect(findReviewsMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "User not authenticated",
      })
    );
  });
});
