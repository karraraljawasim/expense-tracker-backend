import { describe, expect, it, beforeEach } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../helpers/testApp";
import {
  createAuthenticedUser,
  createTestCategory,
} from "../helpers/fixtures.ts";

let userId: Types.ObjectId;
let token: string;

beforeEach(async () => {
  const auth = await createAuthenticedUser();
  token = auth.tokens?.accessToken;
  userId = auth.user?._id;
});

describe("Create category functinalty", () => {
  const createEndpoint = "/api/categories";
  const createPayload = {
    name: "test",
    budgetLimit: 100,
    currency: "USD",
    color: "#6B7280",
  };

  it("disallow duplicated name for the same user", async () => {
    const res = await request(app)
      .post(createEndpoint)
      .set("Authorization", `Bearer ${token}`)
      .send(createPayload);

    expect(res.status).toBe(201);
    await request(app)
      .post(createEndpoint)
      .set("Authorization", `Bearer ${token}`)
      .send(createPayload)
      .expect(409);
  });

  it("reject invalid color format", async () => {
    const res = await request(app)
      .post(createEndpoint)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "Food", color: "InvalidColor" });

    expect(res.status).toBe(400);
  });

  it("create category successfuly", async () => {
    const res = await request(app)
      .post(createEndpoint)
      .set("authorization", `Bearer ${token}`)
      .send(createPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("test");
    expect(res.body.data.color).toBe("#6B7280");
  });
});

describe("Get all categories", async () => {
  const getAllEndpoint = "/api/categories";

  it("return cateories to this user successfully", async () => {
    await createTestCategory(userId, { name: "Food" });
    await createTestCategory(userId, { name: "TV" });

    const res = await request(app)
      .get(getAllEndpoint)
      .set("authorization", `Bearer ${token}`);

    expect(res.body.data.length).toBe(2);
    expect(res.status).toBe(200);
  });

  it("return categories belonging to this user not athers", async () => {
    await createTestCategory(userId, { name: "Food" });

    const atherAuthUser = await createAuthenticedUser({
      email: "ather@example.com",
    });

    await createTestCategory(atherAuthUser.user._id, { name: "ather Food" });

    const res = await request(app)
      .get(getAllEndpoint)
      .set("authorization", `Bearer ${token}`);

    expect(res.body.data.length).toBe(1);
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

describe("Get category by id", async () => {
  it("return category by id successfully", async () => {
    const category = await createTestCategory(userId, { name: "Food" });

    const res = await request(app)
      .get(`/api/categories/${category._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.body.data.name).toBe("Food");
    expect(res.status).toBe(200);
  });

  it("reject request with not token", async () => {
    const category = await createTestCategory(userId, { name: "TV" });

    const res = await request(app).get(`/api/categories/${category._id}`);

    expect(res.status).toBe(401);
  });

  it("reject request with invalid token", async () => {
    const category = await createTestCategory(userId, { name: "TV" });
    const res = await request(app)
      .get(`/api/categories/${category._id}`)
      .set("authorization", `Bearer invalidToken`);

    expect(res.status).toBe(401);
  });
});

describe("Delete category by id", async () => {
  it("delete own category successfully", async () => {
    const category = await createTestCategory(userId, { name: "Food" });

    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.body.data.message).toBe("Delete category successfully");
    expect(res.status).toBe(200);
  });

  it("reject request with not token", async () => {
    const category = await createTestCategory(userId, { name: "TV" });

    const res = await request(app).delete(`/api/categories/${category._id}`);

    expect(res.status).toBe(401);
  });

  it("can not delete ather users cateogry ", async () => {
    const atherUserauth = await createAuthenticedUser({
      email: "atherUser@example.com",
    });
    const authUserCategory = await createTestCategory(atherUserauth.user._id, {
      name: "TV",
    });

    const res = await request(app)
      .delete(`/api/categories/${authUserCategory._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

describe("update category by id", async () => {
  it("update own category successfully", async () => {
    const category = await createTestCategory(userId, { name: "Food" });

    const res = await request(app)
      .patch(`/api/categories/${category._id}`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "new name" });

    expect(res.body.data.name).toBe("new name");
    expect(res.status).toBe(200);
  });

  it("reject request with not token", async () => {
    const category = await createTestCategory(userId, { name: "TV" });

    const res = await request(app)
      .patch(`/api/categories/${category._id}`)
      .send({ name: "new name" });

    expect(res.status).toBe(401);
  });
});
