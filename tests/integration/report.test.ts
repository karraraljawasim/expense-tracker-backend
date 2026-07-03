import { describe, expect, it, beforeEach } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../helpers/testApp.js";
import {
  createAuthenticatedUser,
  createTestCategory,
  createTestExpense,
} from "../helpers/fixtures.js";

let userId: Types.ObjectId;
let token: string;

beforeEach(async () => {
  const auth = await createAuthenticatedUser();
  token = auth.tokens?.accessToken;
  userId = auth.user?._id;
});

describe("get monthly report functionality", () => {
  const endpoint = "/api/reports/monthly?month=2026-06";

  it("get report successfully", async () => {
    const category = await createTestCategory(userId);
    const category2 = await createTestCategory(userId, { name: "test 2" });

    await createTestExpense(userId, category._id);
    await createTestExpense(userId, category2._id);
    await createTestExpense(userId, category._id);

    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data?.totalExpensesOverall).toBe(3);
    expect(res.body.data?.spendingByCategory.length).toBe(2);
  });
});

describe("get report by category functionality", () => {
  it("get report successfully", async () => {
    const category = await createTestCategory(userId);
    const category2 = await createTestCategory(userId, { name: "test 2" });

    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 100,
    });
    await createTestExpense(userId, category2._id, {
      amountInBaseCurrency: 10,
    });
    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 10,
    });
    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 50,
    });
    await createTestExpense(userId, category2._id, {
      amountInBaseCurrency: 40,
    });
    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 30,
    });

    const res = await request(app)
      .get(`/api/reports/categories/${category._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data?.totalSpendOverall).toBe(190);
    expect(res.body.data?.top3ExpensiveExpenses.length).toBe(3);
    expect(res.body.data?.top3ExpensiveExpenses[0].amountInBaseCurrency).toBe(
      100,
    );
  });

  it("return error if category not belong to the same user", async () => {
    const otherAuthUser = await createAuthenticatedUser({
      email: "other@example.com",
    });

    const otherCategory = await createTestCategory(otherAuthUser.user._id);

    await createTestExpense(userId, otherCategory._id);
    await createTestExpense(userId, otherCategory._id);

    const res = await request(app)
      .get(`/api/reports/categories/${otherCategory._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.data?.totalExpensesOverall).toBeUndefined();
  });

  it("return error if category not found", async () => {
    const notExistId = new Types.ObjectId();
    const category = await createTestCategory(userId);

    await createTestExpense(userId, category._id);
    await createTestExpense(userId, category._id);

    const res = await request(app)
      .get(`/api/reports/categories/${notExistId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.data?.totalExpensesOverall).toBeUndefined();
  });
});

describe("get summary functionality", () => {
  const endpoint = `/api/reports/summary`;

  it("get summary successfully", async () => {
    const category = await createTestCategory(userId, {
      budgetLimit: 200,
      name: "test",
    });
    const category2 = await createTestCategory(userId, {
      name: "test 2",
      budgetLimit: 150,
    });

    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 100,
    });
    await createTestExpense(userId, category2._id, {
      amountInBaseCurrency: 10,
    });
    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 10,
    });
    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 50,
    });
    await createTestExpense(userId, category2._id, {
      amountInBaseCurrency: 40,
    });
    await createTestExpense(userId, category._id, {
      amountInBaseCurrency: 30,
    });

    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({ thisMonthBudget: 300 });

    expect(res.status).toBe(200);
    expect(res.body.data?.financial.totalSpendSoFar).toBe(240);
    expect(res.body.data?.financial.remainingBudget).toBe(60);
    expect(res.body.data?.top3Categories[0]._id).toBe(String(category._id));
  });
});
