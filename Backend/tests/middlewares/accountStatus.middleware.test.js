import { describe, expect, jest, test } from "@jest/globals";
import { ensureActiveAccount } from "../../src/middlewares/accountStatus.middleware.js";
import { createMockResponse } from "../setup/testHelpers.js";

describe("ensureActiveAccount Middleware", () => {
  test("continues when the account is active", () => {
    const req = {
      user: {
        accountStatus: "active",
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    ensureActiveAccount(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns ACCOUNT_SUSPENDED when the account is suspended", () => {
    const req = {
      user: {
        accountStatus: "suspended",
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    ensureActiveAccount(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errorCode: "ACCOUNT_SUSPENDED",
      message: "Your account has been suspended.",
    });
  });
});
