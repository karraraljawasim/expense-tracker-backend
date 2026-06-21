import { describe, expect, it, beforeEach } from "vitest";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../helpers/testApp.ts";
import {
  createAuthenticedUser,
  createTestCategory,
  createTestExpense,
} from "../helpers/fixtures.ts";

let userId: Types.ObjectId;
let token: string;

beforeEach(async () => {
  const auth = await createAuthenticedUser();
  token = auth.tokens?.accessToken;
  userId = auth.user?._id;
});

describe("get monthly report functinalty", () => {
  const endpoint = "/api/reports/monthly?month=2026-06";

  it("get report succassfully", async () => {
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

describe("get report by category functinalty", () => {
  it("get report succassfully", async () => {
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

  it("return error if category not belong to the amame user", async () => {
    const atherAuthUser = await createAuthenticedUser({
      email: "ather@example.com",
    });

    const atherCategory = await createTestCategory(atherAuthUser.user._id);

    await createTestExpense(userId, atherCategory._id);
    await createTestExpense(userId, atherCategory._id);

    const res = await request(app)
      .get(`/api/reports/categories/${atherCategory._id}`)
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

describe("get summary functinalty", () => {
  const endpoint = `/api/reports/summary`;

  it("get summary succassfully", async () => {
    const category = await createTestCategory(userId, {
      badgetLimit: 200,
      name: "test",
    });
    const category2 = await createTestCategory(userId, {
      name: "test 2",
      badgetLimit: 150,
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
    expect(res.body.data?.financials.totalSpendSoFar).toBe(240);
    expect(res.body.data?.financials.remainingBudget).toBe(60);
    expect(res.body.data?.top3Cateogries[0]._id).toBe(String(category._id));
  });
});
