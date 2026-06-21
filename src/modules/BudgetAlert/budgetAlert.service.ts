import { Types } from "mongoose";
import { BudgetAlert } from "./budgetAlert.model.js";
import Categories from "../categories/category.model.js";
import { Expense } from "../expenses/expense.model.js";
import { IBudgetAlert, MonthlyBudgetResponse } from "./budgetAlert.types.js";
import {
  GetAllTriggeredAlertsQueryDto,
  GetHistoryBudgetAlertByMonthQuery,
} from "./budgetAlert.validation.js";
import { AppError, NotFoundError } from "../../utils/AppError.js";
import { PaginationResponseDto } from "../../types/pagination.js";
import { getStartAndStartNextMonth } from "../../utils/date.calculate.js";

export interface IBudgetAlertService {
  getMonthlyBudgetStatus: (userId: string) => Promise<MonthlyBudgetResponse>;
  getAllTriggeredAlerts: (
    userId: string,
    query: GetAllTriggeredAlertsQueryDto,
  ) => Promise<PaginationResponseDto<IBudgetAlert>>;
  markBudgetAlertAsRead: (
    userId: string,
    budgetAlertId: string,
  ) => Promise<IBudgetAlert>;
  markAllBudgetAlertAsRead: (
    userId: string,
  ) => Promise<{ countUpdated: number }>;
  getHistoryBudgetAlertByMonth: (
    userId: string,
    query: GetHistoryBudgetAlertByMonthQuery,
  ) => Promise<MonthlyBudgetResponse>;
}
export class BudgetAlertService implements IBudgetAlertService {
  async getMonthlyBudgetStatus(userId: string) {
    const { startOfMonth, startOfNextMonth } = getStartAndStartNextMonth();

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
          remaining: budgetLimit - totalSpent,
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
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;

    const matchStage: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      triggered: true,
    };

    if (query.isRead !== undefined) matchStage.isRead = query.isRead;
    if (query.month) matchStage.month = query.month;

    const triggeredAlerts = await BudgetAlert.aggregate([
      { $match: matchStage },
      { $sort: { triggeredAt: -1 } },
      {
        $facet: {
          metaData: [{ $count: "totalCount" }],
          data: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
              },
            },
            {
              $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
    ]);

    const totalCount = triggeredAlerts[0]?.metaData[0]?.totalCount || 0;

    return {
      data: triggeredAlerts[0]?.data || [],
      metaData: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async markBudgetAlertAsRead(userId: string, bugetAlertId: string) {
    const bugetAlert = await BudgetAlert.findById(bugetAlertId);
    if (!bugetAlert || bugetAlert.userId.toString() !== userId) {
      throw new NotFoundError("BugetAlert");
    }

    if (bugetAlert.isRead) {
      return bugetAlert;
    }

    await BudgetAlert.findByIdAndUpdate(bugetAlertId, {
      isRead: true,
    });

    const updatedBugetAlert = await BudgetAlert.findById(bugetAlertId);

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

  async getHistoryBudgetAlertByMonth(
    userId: string,
    query: GetHistoryBudgetAlertByMonthQuery,
  ) {
    const date = new Date(query.month);
    const { startOfMonth, startOfNextMonth } = getStartAndStartNextMonth(date);

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
