import mongoose from "mongoose";
import Categories from "../modules/categories/category.model.js";
import { BudgetAlert } from "../modules/budgetAlert/budgetAlert.modle.js";
import { NotFoundError } from "../utils/AppError.js";
import { Expense } from "../modules/expenses/expense.modle.js";

export async function checkBudgetAlert(
  userId: string,
  categoryId: string,
  date: Date = new Date(),
) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const month = startOfMonth.toISOString().slice(0, 7);

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

  if (percentage >= 80 && percentage < 100) {
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
