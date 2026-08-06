import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const messageCreateMock = jest.fn();
const messageFindMock = jest.fn();
const messageFindByIdMock = jest.fn();
const messageFindByIdAndUpdateMock = jest.fn();
const projectFindByIdMock = jest.fn();

jest.unstable_mockModule("../../src/models/message.model.js", () => ({
  Message: {
    create: messageCreateMock,
    find: messageFindMock,
    findById: messageFindByIdMock,
    findByIdAndUpdate: messageFindByIdAndUpdateMock,
  },
}));

jest.unstable_mockModule("../../src/models/project.model.js", () => ({
  Project: {
    findById: projectFindByIdMock,
  },
}));

const { createProjectMessage, getProjectMessages, markMessageAsRead } =
  await import("../../src/services/message.service.js");

const projectId = "507f1f77bcf86cd799439011";
const clientId = "507f1f77bcf86cd799439012";
const studentId = "507f1f77bcf86cd799439013";
const outsiderId = "507f1f77bcf86cd799439014";
const messageId = "507f1f77bcf86cd799439015";

const project = {
  _id: projectId,
  client: clientId,
  student: studentId,
};

const createLeanQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const createMessageListQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const createPopulatedMessageQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe("Message Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns project messages for the assigned client", async () => {
    const createdAt = new Date("2026-08-06T10:00:00.000Z");
    const updatedAt = new Date("2026-08-06T10:00:00.000Z");
    const messages = [
      {
        _id: messageId,
        project: projectId,
        sender: {
          _id: clientId,
          fullName: "Ramit Sonar",
          avatar: "https://example.com/avatar.png",
          role: "client",
        },
        message: "Please review the latest update.",
        isRead: false,
        createdAt,
        updatedAt,
      },
    ];

    projectFindByIdMock.mockReturnValue(createLeanQuery(project));
    messageFindMock.mockReturnValue(createMessageListQuery(messages));

    await expect(getProjectMessages(projectId, clientId)).resolves.toEqual([
      {
        id: messageId,
        project: projectId,
        sender: {
          id: clientId,
          fullName: "Ramit Sonar",
          avatar: "https://example.com/avatar.png",
          role: "client",
        },
        message: "Please review the latest update.",
        isRead: false,
        createdAt,
        updatedAt,
      },
    ]);
    expect(messageFindMock).toHaveBeenCalledWith({ project: projectId });
  });

  test("rejects message access when the user is not assigned to the project", async () => {
    projectFindByIdMock.mockReturnValue(createLeanQuery(project));

    await expect(
      getProjectMessages(projectId, outsiderId)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You can access messages only for your own project",
    });
    expect(messageFindMock).not.toHaveBeenCalled();
  });

  test("rejects empty messages before creating a document", async () => {
    projectFindByIdMock.mockReturnValue(createLeanQuery(project));

    await expect(
      createProjectMessage({
        projectId,
        senderId: studentId,
        message: "   ",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Message is required",
    });
    expect(messageCreateMock).not.toHaveBeenCalled();
  });

  test("marks a message as read only after project access is verified", async () => {
    const createdAt = new Date("2026-08-06T10:00:00.000Z");
    const updatedAt = new Date("2026-08-06T10:05:00.000Z");
    const existingMessage = {
      _id: messageId,
      project: projectId,
      sender: studentId,
      message: "I uploaded the deliverable.",
      isRead: false,
      createdAt,
      updatedAt: createdAt,
    };
    const updatedMessage = {
      ...existingMessage,
      isRead: true,
      updatedAt,
      sender: {
        _id: studentId,
        fullName: "Student User",
        avatar: "",
        role: "student",
      },
    };

    messageFindByIdMock.mockReturnValue(createLeanQuery(existingMessage));
    projectFindByIdMock.mockReturnValue(createLeanQuery(project));
    messageFindByIdAndUpdateMock.mockReturnValue(
      createPopulatedMessageQuery(updatedMessage)
    );

    await expect(markMessageAsRead(messageId, clientId)).resolves.toEqual({
      id: messageId,
      project: projectId,
      sender: {
        id: studentId,
        fullName: "Student User",
        avatar: "",
        role: "student",
      },
      message: "I uploaded the deliverable.",
      isRead: true,
      createdAt,
      updatedAt,
    });
    expect(messageFindByIdAndUpdateMock).toHaveBeenCalledWith(
      messageId,
      { isRead: true },
      { new: true, runValidators: true }
    );
  });
});
