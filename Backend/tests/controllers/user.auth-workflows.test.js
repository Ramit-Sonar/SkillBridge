import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const savePendingRegistrationMock = jest.fn();
const deletePendingRegistrationMock = jest.fn();
const saveUserMock = jest.fn();
const sendMailMock = jest.fn();
const verifyTransportMock = jest.fn();

const User = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
};

const PendingRegistration = jest.fn(function (data) {
  Object.assign(this, data);
  this.save = savePendingRegistrationMock;
});
PendingRegistration.findOne = jest.fn();
PendingRegistration.deleteOne = deletePendingRegistrationMock;

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User,
  PendingRegistration,
}));

jest.unstable_mockModule("../../src/services/admin.service.js", () => ({
  getPlatformSettingsData: jest.fn().mockResolvedValue({
    platformName: "SkillBridge",
  }),
}));

jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: jest.fn(() => ({
      verify: verifyTransportMock,
      sendMail: sendMailMock,
    })),
  },
}));

const {
  forgotPassword,
  logoutUser,
  resetPassword,
  sendVerificationOtp,
  verifyEmail,
} = await import("../../src/controllers/user.controller.js");

const mockSelectQuery = (data) => ({
  select: jest.fn().mockResolvedValue(data),
});

describe("User Authentication Workflows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyTransportMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({});
    savePendingRegistrationMock.mockResolvedValue();
    deletePendingRegistrationMock.mockResolvedValue({});
    saveUserMock.mockResolvedValue();
  });

  test("sends registration OTP after validating registration fields", async () => {
    User.findOne.mockResolvedValue(null);
    PendingRegistration.findOne.mockResolvedValue(null);

    const { res, next } = await runController(sendVerificationOtp, {
      body: {
        fullName: "Rita Sharma",
        email: "RITA@college.edu.np",
        password: "password123",
        confirmPassword: "password123",
        role: "student",
      },
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: "rita@college.edu.np" });
    expect(PendingRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Rita Sharma",
        email: "rita@college.edu.np",
        role: "student",
      })
    );
    expect(savePendingRegistrationMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "rita@college.edu.np",
        subject: "Verify your SkillBridge email",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "OTP sent successfully.",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("completes registration when OTP hash matches pending registration", async () => {
    const crypto = await import("crypto");
    const hashedOtp = crypto
      .createHash("sha256")
      .update("123456")
      .digest("hex");
    const createdUser = { _id: "user-1" };
    const safeUser = {
      _id: "user-1",
      email: "student@example.edu.np",
      role: "student",
    };

    PendingRegistration.findOne.mockResolvedValue({
      fullName: "Student User",
      email: "student@example.edu.np",
      password: "password123",
      role: "student",
      verificationOtp: hashedOtp,
      verificationOtpExpires: Date.now() + 60_000,
    });
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(createdUser);
    User.findById.mockReturnValue(mockSelectQuery(safeUser));

    const { res, next } = await runController(verifyEmail, {
      body: {
        email: "student@example.edu.np",
        otp: "123456",
      },
    });

    expect(User.create).toHaveBeenCalledWith({
      fullName: "Student User",
      email: "student@example.edu.np",
      password: "password123",
      role: "student",
    });
    expect(deletePendingRegistrationMock).toHaveBeenCalledWith({
      email: "student@example.edu.np",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: safeUser,
        message: "Registration completed successfully.",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("logs out by clearing refresh token and auth cookies", async () => {
    User.findByIdAndUpdate.mockResolvedValue({});

    const { res, next } = await runController(logoutUser, {
      user: {
        _id: "user-1",
      },
      get: jest.fn(),
      secure: false,
    });

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      { $unset: { refreshToken: 1 } },
      { returnDocument: "after" }
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      "accessToken",
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  test("sends forgot password email and stores hashed reset token", async () => {
    const user = {
      email: "client@example.com",
      generatePasswordResetToken: jest
        .fn()
        .mockReturnValue("plain-reset-token"),
      save: saveUserMock,
    };
    User.findOne.mockResolvedValue(user);

    const { res, next } = await runController(forgotPassword, {
      body: {
        email: " CLIENT@example.com ",
      },
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: "client@example.com" });
    expect(user.generatePasswordResetToken).toHaveBeenCalled();
    expect(saveUserMock).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@example.com",
        subject: "Reset your SkillBridge password",
        text: expect.stringContaining("/reset-password/plain-reset-token"),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  test("resets password when reset token is valid", async () => {
    const user = {
      save: saveUserMock,
    };
    User.findOne.mockResolvedValue(user);

    const { res, next } = await runController(resetPassword, {
      params: {
        token: "plain-reset-token",
      },
      body: {
        password: "newPassword123",
        confirmPassword: "newPassword123",
      },
    });

    expect(User.findOne).toHaveBeenCalledWith({
      passwordResetToken: expect.any(String),
      passwordResetExpires: { $gt: expect.any(Number) },
    });
    expect(user.password).toBe("newPassword123");
    expect(user.passwordResetToken).toBe("");
    expect(user.passwordResetExpires).toBeUndefined();
    expect(saveUserMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
