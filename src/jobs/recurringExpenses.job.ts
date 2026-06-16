import { checkBudgetAlert } from "../helpers/expense.helper.js";
import { Expense } from "../modules/expenses/expense.modle.js";

export async function generateRecurringExpenses() {
  console.log(`[CRON] Starting recurring expenses generation ...`);

  const dueExpensesParents = await Expense.find({
    isRecurring: true,
    "recurrence.parentId": null,
    "recurrence.nextRunAt": { $lte: new Date() },
    isDeleted: false,
  });

  for (const parent of dueExpensesParents) {
    try {
      const { recurrence } = parent;

      // calculate next run date
      let nextDate = new Date(recurrence!.nextRunAt);
      switch (recurrence!.frequency) {
        case "daily":
          nextDate.setDate(nextDate.getDate() + recurrence!.interval);
          break;
        case "weekly":
          nextDate.setDate(nextDate.getDate() + recurrence!.interval * 7);
          break;
        case "monthly":
          nextDate.setDate(nextDate.getMonth() + recurrence!.interval);
          break;
        case "yearly":
          nextDate.setDate(nextDate.getFullYear() + recurrence!.interval);
          break;
      }

      // check if recurrence ended
      if (recurrence!.endDate && recurrence!.nextRunAt > recurrence!.endDate) {
        parent.isRecurring = false;
        await parent.save();
        continue;
      }

      const newExpenseCopy = new Expense({
        userId: parent.userId,
        categoryId: parent.categoryId,
        amount: parent.amount,
        currency: parent.currency,
        amountInBaseCurrency: parent.amountInBaseCurrency,
        note: parent.note,
        date: recurrence!.nextRunAt,
        exchangeRateUsed: parent.exchangeRateUsed,
        isRecurring: false,
        recurrence: {
          parentId: parent._id,
          frequency: recurrence!.frequency,
          interval: recurrence!.interval,
          nextRunAt: nextDate,
          startDate: recurrence!.startDate,
          endDate: recurrence!.endDate,
        },
        attachmentUrl: null,
        isDeleted: false,
      });

      await newExpenseCopy.save();

      parent.recurrence!.nextRunAt = nextDate;
      await parent.save();

      await checkBudgetAlert(
        parent.userId.toString(),
        parent.categoryId.toString(),
        newExpenseCopy.date,
      );
    } catch (error) {
      console.error(`[CRON] Failed for parent ${parent._id}:`, error);
    }
  }
  console.log("End recurring expenses generation ...");
}
