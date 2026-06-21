import bcrypt from "bcrypt";
import { Users } from "../../src/modules/users/user.model.js";
import { jwtUtils } from "../../src/utils/jwt.js";
import Categories from "../../src/modules/categories/category.model.js";
import { Expense } from "../../src/modules/expenses/expense.model.js";
import { Types } from "mongoose";
import { checkBudgetAlert } from "../../src/helpers/expense.helper.js";
import { BudgetAlert } from "../../src/modules/budgetAlert/budgetAlert.model.js";

export function getAuthTokens(user: any) {
  return jwtUtils.signPair({ sub: { id: user._id, role: user.role } });
}
export async function createTestUser(overrides = {}) {
  return await Users.create({
    name: "testUser",
    email: "test@example.com",
    passwordHash: await bcrypt.hash("password123", 10),
    currency: "USD",
    role: "user",
    isDeleted: false,
    ...overrides,
  });
}

export async function createAuthenticedUser(overrides = {}) {
  const user = await createTestUser(overrides);
  const tokens = getAuthTokens(user);

  return { user, tokens };
}

export async function createTestCategory(
  userId: Types.ObjectId,
  overrides = {},
) {
  return await Categories.create({
    userId,
    name: "test cateogry",
    budgetLimit: 100,
    currency: "USD",
    color: "#6B7280",
    ...overrides,
  });
}

export async function createTestExpense(
  userId: Types.ObjectId,
  categoryId: Types.ObjectId,
  overrides = {},
) {
  const expense = await Expense.create({
    categoryId: categoryId,
    userId: userId,
    amount: 50,
    currency: "USD",
    note: "Test",
    exchangeRateUsed: 1,
    amountInBaseCurrency: 50,
    date: new Date("2026-06-01"),
    isRecurring: false,
    recurrence: null,
    attachmentUrl: null,
    ...overrides,
  });

  await checkBudgetAlert(String(userId), String(categoryId));

  return expense;
}

export async function createTestBudgetAlert(
  userId: Types.ObjectId,
  categoryId: Types.ObjectId,
  overrides: Record<string, any> = {},
) {
  const date = overrides.date || new Date();
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  return await BudgetAlert.create({
    userId,
    categoryId,
    month,
    budgetLimit: 100,
    spentAmount: 100,
    percentage: 100,
    alertType: "exceeded",
    triggered: true,
    triggeredAt: new Date(),
    isRead: false,
    isDeleted: false,
    ...overrides,
  });
}
