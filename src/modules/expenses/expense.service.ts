import mongoose from "mongoose";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/AppError.js";
import { BudgetAlert } from "../BudgetAlert/budgetAlert.modle.js";
import Categories from "../categories/category.model.js";
import { Expense } from "./expense.modle.js";
import { IExpense, IGetAllExpensesFilter } from "./expense.types.js";
import {
  CreateExpenseRequestDto,
  GetAllExpensesQueryDto,
} from "./expense.validation.js";

export interface IExpenseService {
  create: (input: CreateExpenseRequestDto, userId: string) => Promise<IExpense>;
  getAll: (
    query: GetAllExpensesQueryDto,
    userId: string,
  ) => Promise<IExpense[]>;
}

export class ExpenseService implements IExpenseService {
  async create(input: CreateExpenseRequestDto, userId: string) {
    const category = await Categories.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError("Category");
    }
    if (category.userId.toString() !== userId) {
      throw new UnauthorizedError("You not the owner to this category");
    }

    let exchangeRate = 1;
    const amountInBaseCurrency = input.amount * exchangeRate;

    let newExpense;

    if (input.isRecurring) {
      if (!input.recurrence || Object.keys(input.recurrence).length === 0) {
        throw new AppError("Recurrence object requierd", 400);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(input.recurrence.startDate);
      startDate.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new AppError("Start date must not be in the past", 400);
      }

      if (input.recurrence.endDate) {
        if (
          new Date(input.recurrence.endDate) <
          new Date(input.recurrence.startDate)
        ) {
          throw new AppError("End date must be after start date", 400);
        }
      }
      if (input.recurrence.interval < 1) {
        throw new AppError("Interval must be 1 or more");
      }

      newExpense = await Expense.create({
        ...input,
        userId: userId,
        amountInBaseCurrency,
        exchangeRateUsed: exchangeRate,
        isRecurring: true,
        recurrence: {
          frequency: input.recurrence.frequency,
          interval: input.recurrence.interval,
          startDate: input.recurrence.startDate,
          endDate: input.recurrence.endDate,
          nextRunAt: input.recurrence.startDate,
          parentId: null,
        },
      });
    } else {
      newExpense = await Expense.create({
        ...input,
        userId: userId,
        amountInBaseCurrency,
        exchangeRateUsed: exchangeRate,
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          categoryId: new mongoose.Types.ObjectId(input.categoryId),
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
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

    if (budgetLimit > 0) {
      const percentage = (totalSpent / budgetLimit) * 100;

      if (percentage >= 80) {
        const alertType = percentage >= 100 ? "exceeded" : "warning";

        const budgetAlertExist = await BudgetAlert.exists({
          userId: userId,
          categoryId: input.categoryId,
          alertType: alertType,
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        });

        if (!budgetAlertExist) {
          await BudgetAlert.create({
            userId: userId,
            categoryId: input.categoryId,
            month: startOfMonth.toISOString().slice(0, 7),
            budgetLimit: budgetLimit,
            spentAmount: totalSpent,
            percentage: percentage,
            alertType: alertType,
          });
        }
      }
    }

    return newExpense;
  }

  async getAll(query: GetAllExpensesQueryDto, userId: string) {
    if (query.categoryId) {
      const category = await Categories.findById(query.categoryId);
      if (!category || category.userId.toString() !== userId) {
        throw new NotFoundError("Category");
      }
    }

    const filterObject: IGetAllExpensesFilter = {
      userId: userId,
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

    filterObject.date = {};
    filterObject.date.$gte = new Date(query.from);
    filterObject.date.$lte = new Date(query.to);

    const expensess = await Expense.find(filterObject);

    return expensess;
  }
}
