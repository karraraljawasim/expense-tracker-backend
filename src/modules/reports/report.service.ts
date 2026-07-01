import { Types } from "mongoose";
import { Expense } from "../expenses/expense.model.js";
import { GetMonthlyReportQuery, GetSummaryQuery } from "./report.validation.js";
import {
  GetExpenseReportByCategoryResponseDto,
  GetMonthlyReportResponseDto,
  GetSummaryResponseDto,
} from "./report.types.js";
import { PaginationResponseDto } from "../../types/pagination.js";
import { Categories } from "../categories/category.model.js";
import { AppError, NotFoundError } from "../../utils/AppError.js";
import { getStartAndStartNextMonth } from "../../utils/date.calculate.js";
import { getCachedSummary, setCacheSummary } from "./report.cache.js";

export interface IReportService {
  getMonthlyReport: (
    query: GetMonthlyReportQuery,
    userId: string,
  ) => Promise<PaginationResponseDto<GetMonthlyReportResponseDto>>;
  getExpenseReportByCategory: (
    categoryId: string,
    userId: string,
  ) => Promise<GetExpenseReportByCategoryResponseDto>;
  getSummary: (
    userId: string,
    query: GetSummaryQuery,
  ) => Promise<GetSummaryResponseDto>;
}
export class ReportService implements IReportService {
  async getMonthlyReport(query: GetMonthlyReportQuery, userId: string) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;

    const date = new Date(query.month);

    const { startOfMonth, startOfNextMonth } = getStartAndStartNextMonth(date);

    const expenseReport = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$categoryId",
          totalSpendByCategory: { $sum: "$amountInBaseCurrency" },
          averageSpendByCategory: { $avg: "$amountInBaseCurrency" },
          expenseCountInCategory: { $sum: 1 },
        },
      },
      {
        $facet: {
          metaData: [
            {
              $group: {
                _id: null,
                totalCategories: { $sum: 1 },
                totalExpensesOverall: { $sum: "$expenseCountInCategory" },
              },
            },
            {
              $project: {
                _id: 0,
              },
            },
          ],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ]);

    const totalCategories = expenseReport[0]?.metaData[0]?.totalCategories || 0;
    const totalExpensesOverall =
      expenseReport[0]?.metaData[0]?.totalExpensesOverall || 0;

    return {
      totalExpensesOverall,
      totalCategories,
      spendingByCategory: expenseReport[0]?.data
        ? expenseReport[0].data.map((row: any) => ({
            categoryId: row?._id,
            totalSpend: row?.totalSpendByCategory,
            averageSpend: row?.averageSpendByCategory,
            expenseCount: row?.expenseCountInCategory,
          }))
        : [],
      metaData: {
        totalCount: totalCategories,
        page,
        pageSize,
        totalPages: Math.round(totalCategories / pageSize),
      },
    };
  }

  async getExpenseReportByCategory(categoryId: string, userId: string) {
    const category = await Categories.findOne({
      _id: new Types.ObjectId(categoryId),
      userId,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    const expenseReport = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          categoryId: new Types.ObjectId(categoryId),
          isDeleted: false,
        },
      },
      {
        $sort: {
          amountInBaseCurrency: -1,
        },
      },
      {
        $facet: {
          metaData: [
            {
              $group: {
                _id: null,
                totalSpendOverall: { $sum: "$amountInBaseCurrency" },
              },
            },
          ],
          expensiveExpenses: [
            { $limit: 3 },
            {
              $project: {
                amount: 99.99,
                currency: 1,
                amountInBaseCurrency: 1,
                exchangeRateUsed: 1,
                note: 1,
                date: 1,
                isRecurring: 1,
                recurrence: 1,
              },
            },
          ],
        },
      },
    ]);

    return {
      totalSpendOverall: expenseReport[0]?.metaData[0]?.totalSpendOverall || 0,
      top3ExpensiveExpenses: expenseReport[0]?.expensiveExpenses || null,
    };
  }

  async getSummary(userId: string, query: GetSummaryQuery) {
    const { startOfMonth, startOfNextMonth } = getStartAndStartNextMonth();

    const thisMonthBudget = parseInt(query.thisMonthBudget);
    if (isNaN(thisMonthBudget)) {
      throw new AppError("thisMonthBudget is invalid it must be number", 400);
    }

    let reportSummary = await getCachedSummary(userId);
    if (reportSummary === null) {
      reportSummary = await Expense.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lt: startOfNextMonth },
            isDeleted: false,
          },
        },
        {
          $facet: {
            totalSpendData: [
              {
                $group: {
                  _id: null,
                  totalSpendSoFar: { $sum: "$amountInBaseCurrency" },
                },
              },
            ],
            top3Categories: [
              {
                $group: {
                  _id: "$categoryId",
                  totalSpend: { $sum: "$amountInBaseCurrency" },
                },
              },
              {
                $sort: {
                  totalSpend: -1,
                },
              },
              {
                $limit: 3,
              },
            ],
          },
        },
      ]);

      await setCacheSummary(userId, reportSummary);
    }

    const report = reportSummary[0];
    const totalSpendSoFar = report?.totalSpendData[0]?.totalSpendSoFar || 0;
    const top3Categories = report?.top3Categories || [];

    // Calculate Time
    const now = new Date();
    const daysPassed = now.getDate();
    const totalDaysInMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0),
    ).getDate();
    const daysRemaining = totalDaysInMonth - daysPassed;

    const averageSpendPerDay =
      daysPassed > 0 ? totalSpendSoFar / daysPassed : 0;
    const projectedTotal = averageSpendPerDay * totalDaysInMonth;

    const remainingBudget = thisMonthBudget - totalSpendSoFar;

    return {
      financial: {
        totalSpendSoFar: Number(totalSpendSoFar.toFixed(2)),
        remainingBudget: Number(remainingBudget.toFixed(2)),
        projectedTotal: Number(projectedTotal.toFixed(2)),
      },
      time: {
        daysRemaining,
        daysPassed,
        totalDaysInMonth,
      },
      top3Categories,
    };
  }
}
