import { Types } from "mongoose";
import { z } from "zod";

export const getAllTriggeredAlertsQuerySchema = z.object({
  isRead: z.boolean().optional().default(false),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, {
      message: "Must be in YYYY-MM format",
    })
    .optional()
    .default(() => {
      const now = new Date();
      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );
      return startOfCurrentMonth.toISOString().slice(0, 7);
    }),
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("10"),
});

export const budgetAlertIdPramsSchema = z.object({
  budgetAlertId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: "Invalid object id format",
  }),
});

export const getHistoryBudgetAlertByMonthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, {
      message: "Must be in YYYY-MM format",
    })
    .optional()
    .default(() => {
      const now = new Date();
      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );
      return startOfCurrentMonth.toISOString().slice(0, 7);
    }),
});

export type GetAllTriggeredAlertsQueryDto = z.infer<
  typeof getAllTriggeredAlertsQuerySchema
>;

export type GetHistoryBudgetAlertByMonthQuery = z.infer<
  typeof getHistoryBudgetAlertByMonthQuerySchema
>;
