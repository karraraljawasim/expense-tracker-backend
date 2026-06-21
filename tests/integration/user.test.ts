import { describe, expect, it, beforeEach } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../helpers/testApp";
import {
  createAuthenticedUser,
  createTestCategory,
  createTestUser,
} from "../helpers/fixtures.ts";

let userId: Types.ObjectId;
let token: string;

beforeEach(async () => {
  const auth = await createAuthenticedUser({ role: "admin" });
  token = auth.tokens?.accessToken;
  userId = auth.user?._id;
});

describe("Get all users", async () => {
  const getAllEndpoint = "/api/admin/users";

  it("return users on successfully", async () => {
    await createTestUser({ email: "user@example.com" });
    await createTestUser({ email: "atherUser@example.com" });

    const res = await request(app)
      .get(getAllEndpoint)
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it("reject request with not token", async () => {
    const res = await request(app).get(getAllEndpoint);

    expect(res.status).toBe(401);
  });

  it("reject request with invalid token", async () => {
    const res = await request(app)
      .get(getAllEndpoint)
      .set("authorization", `Bearer invalidToken`);

    expect(res.status).toBe(401);
  });
});

describe("Get user by id", async () => {
  it("return user by id successfully", async () => {
    const user = await createTestUser({
      name: "user test",
      email: "atherUser@example.com",
    });

    const res = await request(app)
      .get(`/api/admin/users/${user._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.body.data.name).toBe("user test");
    expect(res.status).toBe(200);
  });

  it("reject request with not token", async () => {
    const user = await createTestUser({ email: "atherUser@example.com" });

    const res = await request(app).get(`/api/admin/users/${user._id}`);

    expect(res.status).toBe(401);
  });

  it("throw error if uesr not found", async () => {
    const notExistId = new Types.ObjectId();
    const res = await request(app)
      .get(`/api/admin/users/${notExistId}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("just admin can access", async () => {
    const user = await createTestUser({ email: "atherUser@example.com" });

    const res = await request(app)
      .get(`/api/admin/users/${user._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const notAdmin = await createAuthenticedUser({
      role: "user",
      email: "user@example.com",
    });

    const res2 = await request(app)
      .get(`/api/admin/users/${user._id}`)
      .set("authorization", `Bearer ${notAdmin.tokens.accessToken}`);

    expect(res2.status).toBe(403);
  });
});

describe("soft delete user by id", async () => {
  it("soft deleted user by id successfully", async () => {
    const user = await createTestUser({
      name: "user test",
      email: "atherUser@example.com",
    });

    const res = await request(app)
      .patch(`/api/admin/users/${user._id}/soft-delete`)
      .set("authorization", `Bearer ${token}`);

    expect(res.body.data.isDeleted).toBe(true);
    expect(res.status).toBe(200);
  });

  it("throw error if uesr not found", async () => {
    const notExistId = new Types.ObjectId();
    const res = await request(app)
      .patch(`/api/admin/users/${notExistId}/soft-delete`)
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("update user by id", async () => {
  it("update user by id successfully", async () => {
    const user = await createTestUser({
      name: "user test",
      email: "atherUser@example.com",
    });

    const res = await request(app)
      .patch(`/api/admin/users/${user._id}`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "new name" });

    expect(res.body.data.name).toBe("new name");
    expect(res.status).toBe(200);
  });

  it("throw error if uesr not found", async () => {
    const notExistId = new Types.ObjectId();
    const res = await request(app)
      .patch(`/api/admin/users/${notExistId}`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "new name" });

    expect(res.status).toBe(404);
  });
});
