import cron from "node-cron";
import { generateRecurringExpenses } from "../jobs/recurringExpenses.job.js";

export function startCronJobs() {
  cron.schedule("0 0 * * *", async () => {
    await generateRecurringExpenses();
  });

  console.log(`[CRON] All cron jobs don`);
}
