import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ApiError } from "../../src/utils/ApiError.js";
import { runController } from "../setup/testHelpers.js";

const createReviewMock = jest.fn();
const canReviewProjectMock = jest.fn();
const buildReviewSummaryMock = jest.fn();

jest.unstable_mockModule("../../src/models/review.model.js", () => ({
  Review: {
    create: createReviewMock,
  },
}));

jest.unstable_mockModule("../../src/services/review.service.js", () => ({
  canReviewProject: canReviewProjectMock,
  buildReviewSummary: buildReviewSummaryMock,
}));

const { createReview } =
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
});
