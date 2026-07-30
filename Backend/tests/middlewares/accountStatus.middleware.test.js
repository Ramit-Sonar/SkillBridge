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

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        errorCode: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended.",
      })
    );
  });
});
