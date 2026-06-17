import { z } from "zod";

export const getMonthlyReportQuerySchema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("10"),
  month: z.string().regex(/^\d{4}-\d{2}$/, {
    message: "Must be in YYYY-MM format",
  }),
});

export const getSummaryBodySchema = z.object({
  thisMonthBudget: z.number(),
});

export type GetMonthlyReportQuery = z.infer<typeof getMonthlyReportQuerySchema>;
