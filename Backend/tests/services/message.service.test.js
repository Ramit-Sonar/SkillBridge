import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const messageCreateMock = jest.fn();
const messageCountDocumentsMock = jest.fn();
const messageFindMock = jest.fn();
const messageFindByIdMock = jest.fn();
const messageFindByIdAndUpdateMock = jest.fn();
const projectFindByIdMock = jest.fn();

jest.unstable_mockModule("../../src/models/message.model.js", () => ({
  Message: {
    countDocuments: messageCountDocumentsMock,
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

const {
  createProjectMessage,
  getMessageAttachmentForDownload,
  getProjectMessages,
  markMessageAsRead,
} = await import("../../src/services/message.service.js");

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
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
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
        attachments: [],
        isRead: false,
        createdAt,
        updatedAt,
      },
    ];

    const messageListQuery = createMessageListQuery(messages);

    projectFindByIdMock.mockReturnValue(createLeanQuery(project));
    messageFindMock.mockReturnValue(messageListQuery);
    messageCountDocumentsMock.mockResolvedValue(1);

    await expect(getProjectMessages(projectId, clientId)).resolves.toEqual({
      messages: [
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
          attachments: [],
          isRead: false,
          createdAt,
          updatedAt,
        },
      ],
      pagination: {
        page: 1,
        limit: 30,
        total: 1,
        totalPages: 1,
      },
    });
    expect(messageFindMock).toHaveBeenCalledWith({ project: projectId });
    expect(messageListQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(messageListQuery.skip).toHaveBeenCalledWith(0);
    expect(messageListQuery.limit).toHaveBeenCalledWith(30);
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

  test("returns a message attachment for download after access is verified", async () => {
    const attachment = {
      url: "https://example.com/file.pdf",
      publicId: "messages/file",
      originalName: "file.pdf",
      mimeType: "application/pdf",
      size: 1024,
    };
    const existingMessage = {
      _id: messageId,
      project: projectId,
      attachments: [attachment],
    };

    messageFindByIdMock.mockReturnValue(createLeanQuery(existingMessage));
    projectFindByIdMock.mockReturnValue(createLeanQuery(project));

    await expect(
      getMessageAttachmentForDownload({
        messageId,
        attachmentIndex: "0",
        userId: clientId,
      })
    ).resolves.toEqual(attachment);
    expect(projectFindByIdMock).toHaveBeenCalledWith(projectId);
  });

  test("rejects message creation before a project exists", async () => {
    projectFindByIdMock.mockReturnValue(createLeanQuery(null));

    await expect(
      createProjectMessage({
        projectId,
        senderId: studentId,
        message: "Hello",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Project not found",
    });
    expect(messageCreateMock).not.toHaveBeenCalled();
  });

  test("rejects message creation when the user is not assigned to the project", async () => {
    projectFindByIdMock.mockReturnValue(createLeanQuery(project));

    await expect(
      createProjectMessage({
        projectId,
        senderId: outsiderId,
        message: "Hello",
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You can access messages only for your own project",
    });
    expect(messageCreateMock).not.toHaveBeenCalled();
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

  test("rejects messages longer than 2000 characters", async () => {
    projectFindByIdMock.mockReturnValue(createLeanQuery(project));

    await expect(
      createProjectMessage({
        projectId,
        senderId: studentId,
        message: "a".repeat(2001),
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Message cannot exceed 2000 characters",
    });
    expect(messageCreateMock).not.toHaveBeenCalled();
  });

  test("creates a trimmed message for an assigned student", async () => {
    const createdAt = new Date("2026-08-06T10:00:00.000Z");
    const createdMessage = {
      _id: messageId,
    };
    const populatedMessage = {
      _id: messageId,
      project: projectId,
      sender: {
        _id: studentId,
        fullName: "Student User",
        avatar: "",
        role: "student",
      },
      message: "Hello client",
      attachments: [],
      isRead: false,
      createdAt,
      updatedAt: createdAt,
    };

    projectFindByIdMock.mockReturnValue(createLeanQuery(project));
    messageCreateMock.mockResolvedValue(createdMessage);
    messageFindByIdMock.mockReturnValue(
      createPopulatedMessageQuery(populatedMessage)
    );

    await expect(
      createProjectMessage({
        projectId,
        senderId: studentId,
        message: "  Hello client  ",
      })
    ).resolves.toMatchObject({
      id: messageId,
      project: projectId,
      message: "Hello client",
      attachments: [],
      isRead: false,
      sender: {
        id: studentId,
        role: "student",
      },
    });
    expect(messageCreateMock).toHaveBeenCalledWith({
      project: projectId,
      sender: studentId,
      message: "Hello client",
      attachments: [],
    });
  });

  test("creates an attachment-only message for an assigned student", async () => {
    const createdAt = new Date("2026-08-06T10:00:00.000Z");
    const attachment = {
      url: "https://example.com/file.pdf",
      publicId: "messages/file",
      originalName: "file.pdf",
      mimeType: "application/pdf",
      size: 1024,
    };
    const createdMessage = {
      _id: messageId,
    };
    const populatedMessage = {
      _id: messageId,
      project: projectId,
      sender: {
        _id: studentId,
        fullName: "Student User",
        avatar: "",
        role: "student",
      },
      message: "",
      attachments: [attachment],
      isRead: false,
      createdAt,
      updatedAt: createdAt,
    };

    projectFindByIdMock.mockReturnValue(createLeanQuery(project));
    messageCreateMock.mockResolvedValue(createdMessage);
    messageFindByIdMock.mockReturnValue(
      createPopulatedMessageQuery(populatedMessage)
    );

    await expect(
      createProjectMessage({
        projectId,
        senderId: studentId,
        message: "   ",
        attachments: [attachment],
      })
    ).resolves.toMatchObject({
      id: messageId,
      project: projectId,
      message: "",
      attachments: [attachment],
      isRead: false,
      sender: {
        id: studentId,
        role: "student",
      },
    });
    expect(messageCreateMock).toHaveBeenCalledWith({
      project: projectId,
      sender: studentId,
      message: "",
      attachments: [attachment],
    });
  });

  test("marks a message as read only after project access is verified", async () => {
    const createdAt = new Date("2026-08-06T10:00:00.000Z");
    const updatedAt = new Date("2026-08-06T10:05:00.000Z");
    const existingMessage = {
      _id: messageId,
      project: projectId,
      sender: studentId,
      message: "I uploaded the deliverable.",
      attachments: [],
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
      attachments: [],
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

  test("rejects marking the sender's own message as read", async () => {
    const createdAt = new Date("2026-08-06T10:00:00.000Z");
    const existingMessage = {
      _id: messageId,
      project: projectId,
      sender: studentId,
      message: "I uploaded the deliverable.",
      attachments: [],
      isRead: false,
      createdAt,
      updatedAt: createdAt,
    };

    messageFindByIdMock.mockReturnValue(createLeanQuery(existingMessage));

    await expect(markMessageAsRead(messageId, studentId)).rejects.toMatchObject(
      {
        statusCode: 403,
        message: "You cannot mark your own message as read",
      }
    );
    expect(projectFindByIdMock).not.toHaveBeenCalled();
    expect(messageFindByIdAndUpdateMock).not.toHaveBeenCalled();
  });
});
