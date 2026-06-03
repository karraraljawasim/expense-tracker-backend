import { Types } from "mongoose";
import { BudgetAlert } from "./budgetAlert.modle.js";
import Categories from "../categories/category.model.js";
import { Expense } from "../expenses/expense.modle.js";
import { IBudgetAlert, MonthlyBudgetResponse } from "./budgetAlert.types.js";
import { GetAllTriggeredAlertsQueryDto } from "./budgetAlert.validation.js";
import { AppError, NotFoundError } from "../../utils/AppError.js";

export interface IBudgetAlertService {
  getMonthlyBudgetStatus: (userId: string) => Promise<MonthlyBudgetResponse>;
  getAllTriggeredAlerts: (
    userId: string,
    query: GetAllTriggeredAlertsQueryDto,
  ) => Promise<IBudgetAlert[]>;
  markBudgetAlertAsRead: (
    userId: string,
    budgetAlertId: string,
  ) => Promise<IBudgetAlert>;
  markAllBudgetAlertAsRead: (
    userId: string,
  ) => Promise<{ countUpdated: number }>;
  getHistoryBudgetAlertByMonth: (
    userId: string,
    month: string,
  ) => Promise<MonthlyBudgetResponse>;
}
export class BudgetAlertService implements IBudgetAlertService {
  async getMonthlyBudgetStatus(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const userCategories = await Categories.find({ userId, isDeleted: false });

    const result = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
          categoryId: {
            $in: userCategories.map((c) => new Types.ObjectId(c._id)),
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$categoryId",
          totalSpent: { $sum: "$amountInBaseCurrency" },
        },
      },
    ]);

    const categorySpend = await Promise.all(
      userCategories.map(async (category) => {
        const categoryExpense = result.find(
          (expense) => String(expense._id) === String(category._id),
        );

        const totalSpent = categoryExpense ? categoryExpense.totalSpent : 0;

        const budgetLimit = category.budgetLimit || 0;

        let percentage;
        if (budgetLimit === 0) {
          percentage = 0;
        } else {
          percentage = (totalSpent / budgetLimit) * 100;
          percentage = Math.round(percentage / 100) * 100;
        }

        let status: "safe" | "warning" | "exceeded";

        if (percentage >= 80 && percentage < 100) {
          status = "warning";
        } else if (percentage >= 100) {
          status = "exceeded";
        } else {
          status = "safe";
        }

        const budgetAlert = await BudgetAlert.findOne({
          categoryId: category._id,
          userId,
        });

        return {
          category: {
            _id: category._id.toString(),
            name: category.name,
            color: category.color,
          },
          budgetLimit,
          totalSpent,
          percentage,
          remaining: percentage
            ? Math.round(totalSpent / percentage)
            : totalSpent,
          status,
          alerts: {
            warning: budgetAlert ? budgetAlert.alertType === "warning" : false,
            exceeded: budgetAlert
              ? budgetAlert.alertType === "exceeded"
              : false,
          },
        };
      }),
    );

    const totalBudget = categorySpend.reduce(
      (sum, c) => sum + c.budgetLimit,
      0,
    );
    const totalSpent = categorySpend.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalRemaining = categorySpend.reduce(
      (sum, c) => sum + c.remaining,
      0,
    );
    let categoriesExceeded = 0;
    categorySpend.forEach((c) => {
      c.status === "exceeded"
        ? (categoriesExceeded += 1)
        : (categoriesExceeded += 0);
    });
    let categoriesWarning = 0;
    categorySpend.forEach((c) => {
      c.status === "warning"
        ? (categoriesWarning += 1)
        : (categoriesWarning += 0);
    });

    let categoriesSafe = 0;
    categorySpend.forEach((c) => {
      c.status === "safe" ? (categoriesSafe += 1) : (categoriesSafe += 0);
    });

    return {
      month: startOfMonth,
      categories: categorySpend,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        categoriesExceeded,
        categoriesWarning,
        categoriesSafe,
      },
    };
  }
  async getAllTriggeredAlerts(
    userId: string,
    query: GetAllTriggeredAlertsQueryDto,
  ) {
    const triggeredAlerts = await BudgetAlert.find({
      userId,
      isRead: query.isRead,
      month: query.month,
      triggered: true,
    })
      .sort({ triggeredAt: -1 })
      .populate("categoryId");

    return triggeredAlerts;
  }

  async markBudgetAlertAsRead(userId: string, bugetAlertId: string) {
    const bugetAlert = await BudgetAlert.findById(bugetAlertId);
    if (!bugetAlert || bugetAlert.userId.toString() !== userId) {
      throw new NotFoundError("BugetAlert");
    }

    if (bugetAlert.isRead) {
      return bugetAlert;
    }

    const updatedBugetAlert = await BudgetAlert.findByIdAndUpdate(
      bugetAlertId,
      {
        isRead: true,
      },
    );

    if (!updatedBugetAlert) {
      throw new AppError("Mark budget read falied");
    }

    return updatedBugetAlert;
  }

  async markAllBudgetAlertAsRead(userId: string) {
    const updateAlerts = await BudgetAlert.updateMany(
      {
        isRead: false,
        userId: userId,
      },
      {
        isRead: true,
      },
    );

    return {
      countUpdated: updateAlerts.modifiedCount,
    };
  }

  async getHistoryBudgetAlertByMonth(userId: string, month: string) {
    const date = new Date(month);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfNextMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      1,
    );
    const userCategories = await Categories.find({ userId, isDeleted: false });

    const result = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
          categoryId: {
            $in: userCategories.map((c) => new Types.ObjectId(c._id)),
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$categoryId",
          totalSpent: { $sum: "$amountInBaseCurrency" },
        },
      },
    ]);

    const categorySpend = await Promise.all(
      userCategories.map(async (category) => {
        const categoryExpense = result.find(
          (expense) => String(expense._id) === String(category._id),
        );

        const totalSpent = categoryExpense ? categoryExpense.totalSpent : 0;

        const budgetLimit = category.budgetLimit || 0;

        let percentage;
        if (budgetLimit === 0) {
          percentage = 0;
        } else {
          percentage = (totalSpent / budgetLimit) * 100;
          percentage = Math.round(percentage / 100) * 100;
        }

        let status: "safe" | "warning" | "exceeded";

        if (percentage >= 80 && percentage < 100) {
          status = "warning";
        } else if (percentage >= 100) {
          status = "exceeded";
        } else {
          status = "safe";
        }

        const budgetAlert = await BudgetAlert.findOne({
          categoryId: category._id,
          userId,
        });

        const remaining = budgetLimit - totalSpent;
        return {
          category: {
            _id: category._id.toString(),
            name: category.name,
            color: category.color,
          },
          budgetLimit,
          totalSpent,
          percentage,
          remaining: remaining,
          status,
          alerts: {
            warning: budgetAlert ? budgetAlert.alertType === "warning" : false,
            exceeded: budgetAlert
              ? budgetAlert.alertType === "exceeded"
              : false,
          },
        };
      }),
    );

    const totalBudget = categorySpend.reduce(
      (sum, c) => sum + c.budgetLimit,
      0,
    );
    const totalSpent = categorySpend.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalRemaining = categorySpend.reduce(
      (sum, c) => sum + c.remaining,
      0,
    );
    let categoriesExceeded = 0;
    categorySpend.forEach((c) => {
      c.status === "exceeded"
        ? (categoriesExceeded += 1)
        : (categoriesExceeded += 0);
    });
    let categoriesWarning = 0;
    categorySpend.forEach((c) => {
      c.status === "warning"
        ? (categoriesWarning += 1)
        : (categoriesWarning += 0);
    });

    let categoriesSafe = 0;
    categorySpend.forEach((c) => {
      c.status === "safe" ? (categoriesSafe += 1) : (categoriesSafe += 0);
    });

    return {
      month: date,
      categories: categorySpend,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        categoriesExceeded,
        categoriesWarning,
        categoriesSafe,
      },
    };
  }
}
