import { z } from "zod";
import { Types } from "mongoose";

export const recurrenceSchema = z.object({
  frequency: z
    .enum(["daily", "weekly", "monthly", "yearly"])
    .openapi({ description: "Type of frequency" }),
  interval: z
    .number()
    .min(1, "Min interval is 1")
    .openapi({ description: "Number of interval" }),
  startDate: z.string().openapi({ description: "Start date of recurrence" }),
  endDate: z
    .string()
    .nullable()
    .default(null)
    .openapi({ description: "End date of recurrence" }),
});

export const createExpenseSchema = z.object({
  categoryId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "Invalid object id",
    })
    .openapi({ description: "Category ID belong to the same user" }),
  amount: z
    .number()
    .min(0, "Amount must be greater than 0")
    .openapi({ description: "Spend amount" }),
  currency: z
    .string()
    .optional()
    .default("USD")
    .openapi({ description: "Currency" }),
  note: z
    .string()
    .max(500, "Too long note")
    .nullable()
    .default(null)
    .openapi({ description: "Note for expense" }),
  date: z.string().openapi({ description: "Date of expense" }),
  isRecurring: z
    .boolean()
    .optional()
    .default(false)
    .openapi({ description: "Is expense recurring" }),
  recurrence: recurrenceSchema.nullable().default(null),
  attachmentUrl: z
    .string()
    .nullable()
    .default(null)
    .openapi({ description: "AttachmentUrl for expense" }),
});

export const getAllExpensesQuerySchema = z.object({
  from: z
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
    .openapi({ description: "Start date" }),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}$/, {
      message: "Must be in YYYY-MM format",
    })
    .optional()
    .default(() => {
      const now = new Date();
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );
      return startOfNextMonth.toISOString().slice(0, 7);
    })
    .openapi({ description: "End date" }),
  categoryId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "Invalid object id",
    })
    .optional()
    .openapi({ description: "Category ID" }),
  currency: z.string().max(3).optional().openapi({ description: "Currency" }),
  isRecurring: z
    .preprocess((value) => value === "true" || value === true, z.boolean())
    .optional()
    .openapi({ description: "Is expense recurring" }),
  minAmount: z.coerce
    .number()
    .optional()
    .openapi({ description: "Min amount" }),
  maxAmount: z.coerce
    .number()
    .optional()
    .openapi({ description: "Max amount" }),
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

export const expenseIdPramsSchema = z.object({
  expenseId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "Invalid object id",
    })
    .openapi({ description: "Unique mongoose ID for expense" }),
});

export const updateExpenseSchema = z.object({
  amount: z.number().optional().openapi({ description: "New amount" }),
  currency: z
    .string()
    .max(3)
    .optional()
    .openapi({ description: "New Currency" }),
  categoryId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value))
    .optional()
    .openapi({ description: "New category ID" }),
  note: z.string().optional().openapi({ description: "New note for expense" }),
  date: z.string().optional().openapi({ description: "New date of expense" }),
  attachmentUrl: z
    .string()
    .optional()
    .openapi({ description: "New attachmentUrl for expense" }),
  editScope: z
    .enum(["all", "thisAndFuture", "this"])
    .optional()
    .openapi({ description: "Edit scope for expense" }),
});

export const expenseSoftDeleteQuerySchema = z.object({
  deleteScope: z
    .enum(["all", "this", "thisAndFuture"])
    .optional()
    .openapi({ description: "Delete scope for expense" }),
});

export type CreateExpenseRequestDto = z.infer<typeof createExpenseSchema>;
export type GetAllExpensesQueryDto = z.infer<typeof getAllExpensesQuerySchema>;
export type UpdateExpenseRequestDto = z.infer<typeof updateExpenseSchema>;
