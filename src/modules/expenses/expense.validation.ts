import { z } from "zod";
import { Types } from "mongoose";

export const recurrenceSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().min(1, "Min interval is 1"),
  startDate: z.string(),
  endDate: z.string().nullable().default(null),
});

export const createExpenseSchema = z.object({
  categoryId: z.string().refine((vlaue) => Types.ObjectId.isValid(vlaue), {
    message: "Invalid object id",
  }),
  amount: z.number().min(0, "Amount must be gerater than 0"),
  currency: z.string().optional().default("USD"),
  note: z.string().max(500, "Too long note").nullable().default(null),
  date: z.string(),
  isRecurring: z.boolean().optional().default(false),
  recurrence: recurrenceSchema.nullable().default(null),
  attachmentUrl: z.string().nullable().default(null),
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
    }),
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
    }),
  categoryId: z
    .string()
    .refine((vlaue) => Types.ObjectId.isValid(vlaue), {
      message: "Invalid object id",
    })
    .optional(),
  currency: z.string().max(3).optional(),
  isRecurring: z
    .preprocess((value) => value === "true" || value === true, z.boolean())
    .optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});

export const expenseIdPramseSchema = z.object({
  expenseId: z.string().refine((vlaue) => Types.ObjectId.isValid(vlaue), {
    message: "Invalid object id",
  }),
});

export const updateExpenseSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().max(3).optional(),
  categoryId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value))
    .optional(),
  note: z.string().optional(),
  date: z.string().optional(),
  attachmentUrl: z.string().optional(),
  editScope: z.enum(["all", "thisAndFuture", "this"]).optional(),
});

export const expenseSoftDeleteQuerySchema = z.object({
  deleteScope: z.enum(["all", "this", "thisAndFuture"]).optional(),
});

export type CreateExpenseRequestDto = z.infer<typeof createExpenseSchema>;
export type GetAllExpensesQueryDto = z.infer<typeof getAllExpensesQuerySchema>;
export type UpdateExpenseRequestDto = z.infer<typeof updateExpenseSchema>;
