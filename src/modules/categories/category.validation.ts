import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Types } from "mongoose";

extendZodWithOpenApi(z);

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Too short category name")
    .max(255, "Too long category name")
    .openapi({ description: "Category name" }),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Invalid color format. Expected a 6-character hex code",
    })
    .optional()
    .openapi({ description: "Category color" }),
  budgetLimit: z
    .number()
    .min(0, "Budget limit must be a positive number")
    .optional()
    .openapi({ description: "Category budget limit" }),
  currency: z.string().optional().openapi({ description: "Category currency" }),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Too short category name")
    .max(255, "Too long category name")
    .optional()
    .openapi({ description: "New category name" }),
  color: z.string().optional().openapi({ description: "New category color" }),
  budgetLimit: z
    .number()
    .min(0, "Budget limit must be a positive number")
    .optional()
    .openapi({ description: "New category budget limit" }),
  currency: z
    .string()
    .optional()
    .openapi({ description: "New category currency" }),
});

export const categoryIdParamsSchema = z.object({
  categoryId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "Invalid Mongoose ObjectId",
    })
    .openapi({ description: "Unique ID for category" }),
});

export const paginateQuery = z.object({
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

export type CreateCategoryRequestDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequestDto = z.infer<typeof updateCategorySchema>;
