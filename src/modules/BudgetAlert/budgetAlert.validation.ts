import { Types } from "mongoose";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const getAllTriggeredAlertsQuerySchema = z.object({
  isRead: z
    .string()
    .optional()
    .default("false")
    .openapi({ description: "Is alert read" }),
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
    })
    .openapi({ description: "Month to filter" }),
  page: z
    .string()
    .optional()
    .default("1")
    .openapi({ description: "Number of page" }),
  pageSize: z
    .string()
    .optional()
    .default("10")
    .openapi({ description: "Number of limit" }),
});

export const budgetAlertIdPramsSchema = z.object({
  budgetAlertId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "Invalid object id format",
    })
    .openapi({
      description: "Unique ID for budget alert ",
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
    })
    .openapi({ description: "Month to filter" }),
});

export type GetAllTriggeredAlertsQueryDto = z.infer<
  typeof getAllTriggeredAlertsQuerySchema
>;

export type GetHistoryBudgetAlertByMonthQuery = z.infer<
  typeof getHistoryBudgetAlertByMonthQuerySchema
>;
