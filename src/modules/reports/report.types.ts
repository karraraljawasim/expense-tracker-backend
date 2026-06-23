import { Types } from "mongoose";
import { IExpense } from "../expenses/expense.types.js";

export type GetMonthlyReportResponseDto = {
  totalExpensesOverall: number;
  totalCategories: number;
  spendingByCategory: {
    categoryId: Types.ObjectId;
    totalSpend: number;
    averageSpend: number;
    expenseCount: number;
  }[];
};

export type GetExpenseReportByCategoryResponseDto = {
  totalSpendOverall: number;
  top3ExpensiveExpenses: IExpense[];
};

export type GetSummaryResponseDto = {
  financial: {
    totalSpendSoFar: number;
    remainingBudget: number;
    projectedTotal: number;
  };
  time: {
    daysRemaining: number;
    daysPassed: number;
    totalDaysInMonth: number;
  };
  top3Categories: any[];
};
