import { beforeEach, describe, expect, test, jest } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const User = {
  findOne: jest.fn(),
  findById: jest.fn(),
};

const PendingRegistration = {};

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  User,
  PendingRegistration,
}));

const { loginUser } = await import("../../src/controllers/user.controller.js");

const mockSelectQuery = (data) => ({
  select: jest.fn().mockResolvedValue(data),
});

describe("Authentication Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("logs in a valid user and sets auth cookies", async () => {
    const foundUser = {
      _id: "user-1",
      role: "student",
      isPasswordCorrect: jest.fn().mockResolvedValue(true),
    };
    const tokenUser = {
      generateAccessToken: jest.fn().mockResolvedValue("access-token"),
      generateRefreshToken: jest.fn().mockResolvedValue("refresh-token"),
      save: jest.fn().mockResolvedValue(),
    };
    const safeUser = {
      _id: "user-1",
      email: "student@example.com",
      role: "student",
    };

    User.findOne.mockResolvedValue(foundUser);
    User.findById
      .mockResolvedValueOnce(tokenUser)
      .mockReturnValueOnce(mockSelectQuery(safeUser));

    const { res, next } = await runController(loginUser, {
      body: {
        email: " STUDENT@EXAMPLE.COM ",
        password: "password123",
      },
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: "student@example.com" });
    expect(foundUser.isPasswordCorrect).toHaveBeenCalledWith("password123");
    expect(tokenUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(res.cookie).toHaveBeenCalledWith(
      "accessToken",
      "access-token",
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        message: "Login successful",
        data: {
          user: safeUser,
        },
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("returns validation error when login fields are missing", async () => {
    const { next } = await runController(loginUser, {
      body: { email: "student@example.com" },
    });

    expect(User.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Email and password are required",
      })
    );
  });

  test("returns unauthorized when the password is invalid", async () => {
    const foundUser = {
      _id: "user-1",
      role: "student",
      isPasswordCorrect: jest.fn().mockResolvedValue(false),
    };
    User.findOne.mockResolvedValue(foundUser);

    const { next } = await runController(loginUser, {
      body: {
        email: "student@example.com",
        password: "wrong-password",
      },
    });

    expect(foundUser.isPasswordCorrect).toHaveBeenCalledWith("wrong-password");
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Invalid email or password",
      })
    );
  });
});
