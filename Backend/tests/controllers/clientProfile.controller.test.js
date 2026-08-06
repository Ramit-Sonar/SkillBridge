import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { runController } from "../setup/testHelpers.js";

const ClientProfile = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../src/models/clientProfile.model.js", () => ({
  ClientProfile,
}));

const { getClientProfile, updateClientProfile } =
  await import("../../src/controllers/clientProfile.controller.js");

describe("Client Profile Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns the authenticated client's existing profile", async () => {
    const profile = {
      _id: "profile-1",
      user: "client-1",
      bio: "We post beginner friendly work.",
      location: "Kathmandu",
      companyName: "SkillBridge Labs",
      website: "https://example.com",
    };

    ClientProfile.findOne.mockResolvedValue(profile);

    const { res, next } = await runController(getClientProfile, {
      user: { _id: "client-1" },
    });

    expect(ClientProfile.findOne).toHaveBeenCalledWith({ user: "client-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        data: profile,
        message: "Client profile fetched successfully",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("returns an empty profile state for a newly registered client", async () => {
    ClientProfile.findOne.mockResolvedValue(null);

    const { res, next } = await runController(getClientProfile, {
      user: { _id: "client-1" },
    });

    expect(ClientProfile.findOne).toHaveBeenCalledWith({ user: "client-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        data: null,
        message: "Client profile is empty.",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("creates the client profile when settings are saved for the first time", async () => {
    const profile = {
      _id: "profile-1",
      user: "client-1",
      bio: "We hire students for small projects.",
      location: "Kathmandu",
      companyName: "SkillBridge Labs",
      website: "https://example.com",
    };

    ClientProfile.findOneAndUpdate.mockResolvedValue(profile);

    const { res, next } = await runController(updateClientProfile, {
      user: { _id: "client-1" },
      body: {
        bio: profile.bio,
        location: profile.location,
        companyName: profile.companyName,
        website: profile.website,
      },
    });

    expect(ClientProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { user: "client-1" },
      {
        $set: {
          bio: profile.bio,
          location: profile.location,
          companyName: profile.companyName,
          website: profile.website,
        },
        $setOnInsert: { user: "client-1" },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        data: profile,
        message: "Profile updated successfully.",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
