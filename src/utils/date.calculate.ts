export function calculateStartDateInMidnight(startDate: string) {
  const startedDate = new Date(startDate);
  startedDate.setHours(0, 0, 0, 0);

  return startedDate;
}

export function getStartAndStartNextMonth(date: Date = new Date()) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { startOfMonth, startOfNextMonth };
}

export function calculateNextRunAt(
  nextRunAt: Date,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  interval: number,
) {
  let nextDate = new Date(nextRunAt);
  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + interval * 7);
      break;
    case "monthly":
      nextDate.setDate(nextDate.getMonth() + interval);
      break;
    case "yearly":
      nextDate.setDate(nextDate.getFullYear() + interval);
      break;
  }

  return nextDate;
}
