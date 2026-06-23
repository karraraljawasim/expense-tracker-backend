import { describe, expect, it, beforeEach } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../helpers/testApp";
import {
  createAuthenticatedUser,
  createTestBudgetAlert,
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

describe("get monthly budget status functionality", () => {
  const endpoint = "/api/budgets";

  it("get budget status successfully", async () => {
    const category = await createTestCategory(userId, { budgetLimit: 100 });
    const category2 = await createTestCategory(userId, {
      name: "Test 2",
      budgetLimit: 100,
    });

    await createTestExpense(userId, category._id, { amount: 50 });
    await createTestExpense(userId, category._id, { amount: 50 });
    await createTestExpense(userId, category2._id, { amount: 50 });

    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.categories.length).toBe(2);
    expect(res.body.data.summary.totalSpent).toBe(150);
    expect(res.body.data.summary.totalRemaining).toBe(50);
  });
});

describe("get all triggered budget status functionality", () => {
  const endpoint = "/api/budgets/alerts?month=2026-06";

  it("get triggered budget successfully", async () => {
    const category = await createTestCategory(userId, { budgetLimit: 100 });
    const category2 = await createTestCategory(userId, {
      name: "Test 2",
      budgetLimit: 100,
    });

    await createTestExpense(userId, category._id, { amount: 50 });
    await createTestExpense(userId, category._id, { amount: 50 });
    await createTestExpense(userId, category2._id, { amount: 50 });

    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBe(2);
    expect(res.body.data.data[0]?.triggered).toBe(true);
    expect(res.body.data.data[0]?.categoryId).toBe(String(category._id));
  });
});

describe("mark budget isRead functionality", () => {
  it("mark budget successfully", async () => {
    const category = await createTestCategory(userId, { budgetLimit: 100 });

    const budgetAlert = await createTestBudgetAlert(userId, category._id, {
      isRead: false,
    });

    const res = await request(app)
      .patch(`/api/budgets/alerts/${budgetAlert._id}/read`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data._id).toBe(String(budgetAlert._id));
  });
});

describe("mark all alerts isRead functionality", () => {
  it("mark all alerts successfully", async () => {
    const category = await createTestCategory(userId, { budgetLimit: 100 });
    const category2 = await createTestCategory(userId, {
      budgetLimit: 100,
      name: "Test 2",
    });
    const category3 = await createTestCategory(userId, {
      budgetLimit: 100,
      name: "test 3",
    });

    await createTestBudgetAlert(userId, category._id, {
      isRead: false,
    });
    await createTestBudgetAlert(userId, category2._id, {
      isRead: false,
    });
    await createTestBudgetAlert(userId, category3._id, {
      isRead: false,
    });

    const res = await request(app)
      .patch(`/api/budgets/alerts/read-all`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.countUpdated).toBe(3);
  });
});
