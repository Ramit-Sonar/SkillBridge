import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const studentProfileFindOneAndUpdateMock = jest.fn();
const uploadAttachmentsMock = jest.fn();
const deleteAttachmentsMock = jest.fn();
const removeTempFilesMock = jest.fn();

const mongooseMock = {
  isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
}));

jest.unstable_mockModule("../../src/models/studentProfile.model.js", () => ({
  StudentProfile: {
    findOneAndUpdate: studentProfileFindOneAndUpdateMock,
  },
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User: {},
}));

jest.unstable_mockModule("../../src/models/verification.model.js", () => ({
  Verification: {},
}));

jest.unstable_mockModule("../../src/services/application.service.js", () => ({
  buildStudentSummary: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/project.service.js", () => ({
  getStudentCompletedProjectProfileMap: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/review.service.js", () => ({
  getStudentReviewProfileMap: jest.fn(),
}));

jest.unstable_mockModule("../../src/utils/attachment.js", () => ({
  deleteAttachments: deleteAttachmentsMock,
  uploadAttachments: uploadAttachmentsMock,
}));

jest.unstable_mockModule("../../src/utils/tempFile.js", () => ({
  removeTempFiles: removeTempFilesMock,
}));

const { addStudentCertificate, deleteStudentCertificate } =
  await import("../../src/controllers/studentProfile.controller.js");

const studentUser = {
  _id: "507f1f77bcf86cd799439011",
  role: "student",
};

const certificateId = "507f1f77bcf86cd799439012";

describe("Student Certificate Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("adds a student certificate with uploaded file metadata", async () => {
    const saveMock = jest.fn().mockResolvedValue();
    const certificateFile = {
      url: "https://cdn.example.com/certificate.pdf",
      publicId: "cert-1",
      originalName: "certificate.pdf",
      mimeType: "application/pdf",
      size: 1234,
    };
    const profile = {
      certificates: [],
      save: saveMock,
    };
    profile.certificates.push = jest.fn((certificate) => {
      Array.prototype.push.call(profile.certificates, {
        _id: {
          toString: () => certificateId,
        },
        ...certificate,
      });
      return profile.certificates.length;
    });

    studentProfileFindOneAndUpdateMock.mockResolvedValue(profile);
    uploadAttachmentsMock.mockResolvedValue([certificateFile]);

    const { res, next } = await runController(addStudentCertificate, {
      user: studentUser,
      file: {
        path: "public/temp/certificate.pdf",
      },
      body: {
        title: "React Basics",
        issuingOrganization: "Coursera",
        issueDate: "2026-08-01",
        credentialUrl: "https://example.com/credential",
      },
    });

    expect(uploadAttachmentsMock).toHaveBeenCalledWith([
      {
        path: "public/temp/certificate.pdf",
      },
    ]);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: certificateId,
          title: "React Basics",
          file: certificateFile,
        }),
        message: "Certificate uploaded successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("deletes a certificate and removes its stored attachment", async () => {
    const saveMock = jest.fn().mockResolvedValue();
    const deleteOneMock = jest.fn();
    const fileToDelete = {
      publicId: "cert-1",
      url: "https://cdn.example.com/certificate.pdf",
    };
    const certificate = {
      file: fileToDelete,
      deleteOne: deleteOneMock,
    };
    const profile = {
      certificates: {
        id: jest.fn().mockReturnValue(certificate),
      },
      save: saveMock,
    };

    studentProfileFindOneAndUpdateMock.mockResolvedValue(profile);
    deleteAttachmentsMock.mockResolvedValue();

    const { res, next } = await runController(deleteStudentCertificate, {
      user: studentUser,
      params: {
        certificateId,
      },
    });

    expect(profile.certificates.id).toHaveBeenCalledWith(certificateId);
    expect(deleteOneMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(deleteAttachmentsMock).toHaveBeenCalledWith([fileToDelete]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { certificateId },
        message: "Certificate deleted successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
