import { describe, expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Health Endpoint", () => {
  test("returns API and database status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: "SkillBridge API is running",
    });
    expect(["connected", "disconnected"]).toContain(response.body.database);
  });
});
