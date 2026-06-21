import mongoose, { Types } from "mongoose";

import Categories from "../modules/categories/category.model.js";
import { BudgetAlert } from "../modules/budgetAlert/budgetAlert.model.js";
import { AppError, NotFoundError } from "../utils/AppError.js";
import { Expense } from "../modules/expenses/expense.model.js";
import { GetAllExpensesQueryDto } from "../modules/expenses/expense.validation.js";
import { IGetAllExpensesFilter } from "../modules/expenses/expense.types.js";

export async function checkBudgetAlert(
  userId: string,
  categoryId: string,
  date: Date = new Date(),
) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const category = await Categories.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category");
  }

  const result = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        categoryId: new mongoose.Types.ObjectId(categoryId),
        date: { $gte: startOfMonth, $lt: startOfNextMonth },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amountInBaseCurrency" },
      },
    },
  ]);

  const totalSpent = result.length > 0 ? result[0].totalSpent : 0;
  const budgetLimit = category.budgetLimit || 0;

  if (budgetLimit === 0) return;

  const percentage = (totalSpent / budgetLimit) * 100;

  if (percentage < 80) {
    await BudgetAlert.deleteMany({ userId, categoryId, month });
    return;
  }

  if (percentage >= 80) {
    await BudgetAlert.deleteMany({
      userId,
      categoryId,
      month,
      alertType: "exceeded",
    });

    const alertsToCheck: Array<{
      threshold: number;
      alertType: "warning" | "exceeded";
    }> = [
      { threshold: 80, alertType: "warning" },
      { threshold: 100, alertType: "exceeded" },
    ];

    for (const { threshold, alertType } of alertsToCheck) {
      if (percentage >= threshold) {
        const existingAlert = await BudgetAlert.findOne({
          userId,
          categoryId,
          alertType,
          month,
        });

        if (!existingAlert) {
          await BudgetAlert.create({
            userId,
            month,
            categoryId,
            spentAmount: totalSpent,
            percentage,
            budgetLimit,
            alertType,
            triggered: true,
            triggeredAt: new Date(),
          });
        } else {
          await BudgetAlert.findByIdAndUpdate(existingAlert._id, {
            spentAmount: totalSpent,
            percentage,
            triggeredAt: new Date(),
          });
        }
      }
    }
  }
}

export function computeAmountInBaseCurrency(
  exchangeRate: number,
  amount: number,
) {
  return amount * exchangeRate;
}

export function createfilterObject(
  query: GetAllExpensesQueryDto,
  userId: string,
) {
  const filterObject: IGetAllExpensesFilter = {
    userId: new Types.ObjectId(userId),
    isDeleted: false,
  };

  if (query.categoryId) {
    filterObject.categoryId = query.categoryId;
  }

  if (query.currency) {
    filterObject.currency = query.currency;
  }

  if (query.maxAmount !== undefined || query.minAmount !== undefined) {
    filterObject.amount = {};

    if (query.minAmount !== undefined) {
      filterObject.amount.$gte = query.minAmount;
    }
    if (query.maxAmount !== undefined) {
      filterObject.amount.$lte = query.maxAmount;
    }
  }
  if (query.isRecurring !== undefined) {
    filterObject.isRecurring = query.isRecurring;

    if (query.isRecurring === true) {
      filterObject["recurrence.parentId"] = null;
    }
  }

  if (query.from > query.to) {
    throw new AppError("(to) date must be greater than (from) date", 400);
  }

  filterObject.date = {};
  filterObject.date.$gte = new Date(query.from);
  filterObject.date.$lt = new Date(query.to);

  return filterObject;
}
