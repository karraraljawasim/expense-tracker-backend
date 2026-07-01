import { vi, describe, beforeEach, it, expect } from "vitest";

vi.mock("../categories/category.model", () => ({
  Categories: {
    findById: vi.fn(),
  },
}));

vi.mock("../users/user.model", () => ({
  Users: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn(),
    aggregate: vi.fn(),
  },
}));

import { ExpenseService } from "./expense.service.js";
import { Types } from "mongoose";
import { Categories } from "../categories/category.model.js";
import {
  computeAmountInBaseCurrency,
  createFilterObject,
} from "../../helpers/expense.helper.js";
import { calculateStartDateInMidnight } from "../../utils/date.calculate.js";

const expenseService = new ExpenseService();

describe("ExpenseService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("check category ownership before create", async () => {
    const otherUserId = new Types.ObjectId();
    const categoryId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    Categories.findById = vi.fn().mockResolvedValue({
      _id: categoryId,
      userId: otherUserId,
    });

    await expect(
      expenseService.create(
        {
          categoryId: categoryId,
          amount: 200,
          currency: "USD",
          note: null,
          date: new Date("2026-06-22").toISOString(),
          isRecurring: false,
          recurrence: null,
          attachmentUrl: null,
        },
        userId,
      ),
    ).rejects.toThrow();
  });

  it("calculate amount in base currency correctly", async () => {
    const exchangeRate = 1;
    const amount = 200;
    const amountInBaseCurrency = computeAmountInBaseCurrency(
      exchangeRate,
      amount,
    );

    expect(amountInBaseCurrency).toBe(200);

    const exchangeRate2 = 2.5;
    const amount2 = 250;
    const amountInBaseCurrency2 = computeAmountInBaseCurrency(
      exchangeRate2,
      amount2,
    );

    expect(amountInBaseCurrency2).toBe(625);
  });

  it("calculate startDate in recurrence expense correctly", async () => {
    const startDate = calculateStartDateInMidnight("May 15, 2026 14:30:00");

    const expectedDate = new Date("May 15, 2026 00:00:00");
    expect(startDate).toEqual(expectedDate);
  });
});

describe("ExpenseService.getAll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("check category ownership before filter", async () => {
    const otherUserId = new Types.ObjectId();
    const categoryId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    Categories.findById = vi.fn().mockResolvedValue({
      _id: categoryId,
      userId: otherUserId,
    });

    const query = {
      from: "2026-05",
      to: "2025-07",
      page: "1",
      pageSize: "10",
      categoryId: otherUserId.toString(),
    };

    await expect(expenseService.getAll(query, userId)).rejects.toThrow();
  });

  it("create filter object correctly", async () => {
    const userId = new Types.ObjectId().toString();
    const categoryId = new Types.ObjectId().toString();

    const query = {
      from: "2026-05",
      to: "2026-07",
      page: "1",
      pageSize: "10",
      categoryId: categoryId,
    };

    const query2 = {
      from: "2026-05",
      to: "2026-04",
      page: "1",
      pageSize: "10",
      categoryId: categoryId,
    };

    const filterObject = createFilterObject(query, userId);
    expect(filterObject).toHaveProperty("categoryId");
    expect(filterObject.date).toEqual({
      $gte: new Date("2026-05-01T00:00:00.000Z"),
      $lt: new Date("2026-07-01T00:00:00.000Z"),
    });

    try {
      createFilterObject(query2, userId);
    } catch (error: any) {
      expect(error.message).toBe("(to) date must be greater than (from) date");
    }
  });
});
