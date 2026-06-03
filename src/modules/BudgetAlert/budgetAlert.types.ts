import { Types } from "mongoose";

export type IBudgetAlert = {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: string;
  budgetLimit: number;
  spentAmount: number;
  percentage: number;
  alertType: "warning" | "exceeded";
  triggered: boolean;
  triggeredAt: Date | null;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
};

export type CategoryDetails = {
  _id: string;
  name: string;
  color?: string;
};

export type BudgetAlerts = {
  warning: boolean;
  exceeded: boolean;
};

export type CategoryBudgetReport = {
  category: CategoryDetails;
  budgetLimit: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: "safe" | "warning" | "exceeded";
  alerts: BudgetAlerts;
};

export type BudgetSummary = {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  categoriesExceeded: number;
  categoriesWarning: number;
  categoriesSafe: number;
};

export type MonthlyBudgetResponse = {
  month: Date;
  categories: CategoryBudgetReport[];
  summary: BudgetSummary;
};
