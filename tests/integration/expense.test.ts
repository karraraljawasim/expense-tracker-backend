import { describe, expect, it, beforeEach } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../helpers/testApp";
import {
  createAuthenticatedUser,
  createTestCategory,
  createTestExpense,
} from "../helpers/fixtures.ts";

let userId: Types.ObjectId;
let token: string;

beforeEach(async () => {
  const auth = await createAuthenticatedUser();
  token = auth.tokens?.accessToken;
  userId = auth.user?._id;
});

describe("create expense functionary", () => {
  const endpoint = "/api/expenses";
  const createExpensePayload = {
    amount: 50,
    currency: "USD",
    note: "Test",
    exchangeRateUsed: 1,
    amountInBaseCurrency: 50,
    date: new Date("2026-06-01"),
    isRecurring: false,
    recurrence: null,
    attachmentUrl: null,
  };

  it("create expense successfully", async () => {
    const category = await createTestCategory(userId);

    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...createExpensePayload, categoryId: category._id, userId });

    expect(res.status).toBe(201);
    expect(res.body.data.note).toBe("Test");
    expect(res.body.data.amount).toBe(50);
  });

  it("create recurrence expense successfully", async () => {
    const category = await createTestCategory(userId);

    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...createExpensePayload,
        categoryId: category._id,
        userId,
        isRecurring: true,
        recurrence: {
          frequency: "monthly",
          interval: 1,
          startDate: new Date("2026-06-25"),
          nextRunAt: new Date("2026-06-26"),
          endDate: null,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.note).toBe("Test");
    expect(res.body.data.isRecurring).toBe(true);
    expect(res.body.data.recurrence.frequency).toBe("monthly");
  });

  it("felid in create recurrence expense if start date in past", async () => {
    const category = await createTestCategory(userId);

    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...createExpensePayload,
        categoryId: category._id,
        userId,
        isRecurring: true,
        recurrence: {
          frequency: "monthly",
          interval: 1,
          startDate: new Date("2026-06-02"),
          nextRunAt: new Date("2026-06-02"),
          endDate: null,
        },
      });

    expect(res.status).toBe(400);
  });

  it("throw error if category not belong to the same user", async () => {
    const otherAuthUser = await createAuthenticatedUser({
      email: "otherUser@example.com",
    });

    const otherCategory = await createTestCategory(otherAuthUser.user._id);

    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...createExpensePayload, categoryId: otherCategory._id, userId });

    expect(res.status).toBe(401);
  });

  it("throw error if category not belong to the same user", async () => {
    const otherAuthUser = await createAuthenticatedUser({
      email: "otherUser@example.com",
    });

    const otherCategory = await createTestCategory(otherAuthUser.user._id);

    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...createExpensePayload, categoryId: otherCategory._id, userId });

    expect(res.status).toBe(401);
  });
});

describe("update expense functionary", () => {
  it("update expense successfully", async () => {
    const category = await createTestCategory(userId);
    const expense = await createTestExpense(userId, category._id, {
      amount: 500,
    });

    const res = await request(app)
      .patch(`/api/expenses/${expense._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(1000);
  });

  it("throw error if expense not fount", async () => {
    const sameId = new Types.ObjectId();
    const res = await request(app)
      .post(`/api/expenses/${sameId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        note: "new note",
      });

    expect(res.status).toBe(404);
  });
});

describe("soft delete expense functionary", () => {
  it("soft delete expense successfully", async () => {
    const category = await createTestCategory(userId);
    const expense = await createTestExpense(userId, category._id, {
      amount: 500,
    });

    const res = await request(app)
      .delete(`/api/expenses/${expense._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("disallow to deleted other expense", async () => {
    const otherAuthUser = await createAuthenticatedUser({
      email: "other@example.com",
    });
    const otherCategory = await createTestCategory(otherAuthUser.user._id, {
      name: "test 1",
    });

    const otherExpense = await createTestExpense(
      otherAuthUser.user._id,
      otherCategory._id,
    );

    const res = await request(app)
      .delete(`/api/expenses/${otherExpense._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

describe("get expense by id functionary", () => {
  it("get expense by id successfully", async () => {
    const category = await createTestCategory(userId);
    const expense = await createTestExpense(userId, category._id, {
      amount: 500,
    });

    const res = await request(app)
      .get(`/api/expenses/${expense._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(500);
  });
});
