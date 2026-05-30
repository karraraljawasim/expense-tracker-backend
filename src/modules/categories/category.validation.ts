import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Too short category name")
    .max(255, "Too long category name"),
  color: z.string(),
  budgetLimit: z.number().min(0, "Budget limit must be a positive number"),
  currency: z.enum(["USD", "IQD"]).optional(),
});

export type CreateCategoryRequestDto = z.infer<typeof createCategorySchema>;
