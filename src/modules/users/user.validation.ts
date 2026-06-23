import { z } from "zod";
import { Types } from "mongoose";

export const updateUserSchema = z.object({
  name: z.string().min(2, "Too short name").optional(),
  currency: z.enum(["USD", "IQD"]).default("USD").optional(),
  role: z.enum(["admin", "user"]).default("user").optional(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: "Invalid Mongoose ObjectId",
  }),
});

export const paginateQuery = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("10"),
});

export type UpdateUserRequestDto = z.infer<typeof updateUserSchema>;
