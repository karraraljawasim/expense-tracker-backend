import { Types } from "mongoose";
import { IExpense } from "../expenses/expense.types.js";

export type GetMonthlyReportResponseDto = {
  totalExpensesOveral: number;
  totalCategories: number;
  spendingByCategory: {
    categoryId: Types.ObjectId;
    totalSpend: number;
    avargSpend: number;
    expenseCount: number;
  }[];
};

export type GetExpenseReportByCategoryResponseDto = {
  totalSpendOverall: number;
  top3ExpensiveExpenses: IExpense[];
};

export type GetSummaryResponseDto = {
  financials: {
    totalSpendSoFar: number;
    remainingBudget: number;
    projectedTotal: number;
  };
  time: {
    daysRemaining: number;
    daysPassed: number;
    totalDaysInMonth: number;
  };
  top3Cateogries: any[];
};
