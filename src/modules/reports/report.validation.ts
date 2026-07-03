import { z } from "zod";

export const getMonthlyReportQuerySchema = z.object({
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
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, {
      message: "Must be in YYYY-MM format",
    })
    .openapi({ description: "Month" }),
});

export const getSummaryQuerySchema = z.object({
  thisMonthBudget: z
    .string()
    .openapi({ description: "Number of this month budget (as string)" }),
});

export type GetMonthlyReportQuery = z.infer<typeof getMonthlyReportQuerySchema>;
export type GetSummaryQuery = z.infer<typeof getSummaryQuerySchema>;
