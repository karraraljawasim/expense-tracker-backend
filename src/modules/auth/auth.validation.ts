import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { swaggerRegistry } from "../../config/swagger/swagger.registry.js";

extendZodWithOpenApi(z);

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Too short name")
      .openapi({ description: "User name" }),
    email: z.string().email().openapi({ description: "User email" }),
    password: z
      .string()
      .min(8, "Too short password")
      .openapi({ description: "User password" }),
    currency: z
      .enum(["USD", "IQD"])
      .default("USD")
      .openapi({ description: "User base currency" }),
    role: z
      .enum(["admin", "user"])
      .default("user")
      .openapi({ description: "User role" }),
  })
  .openapi({ description: "RegisterUserSchema" });

export const loginSchema = z
  .object({
    email: z.string().email().openapi({ description: "User email" }),
    password: z
      .string()
      .min(8, "Too short password")
      .openapi({ description: "User password" }),
  })
  .openapi({ description: "LoginUserSchema" });

swaggerRegistry.register("RegisterUserSchema", registerSchema);
swaggerRegistry.register("LoginUserSchema", loginSchema);

export type RegisterUserRequestDto = z.infer<typeof registerSchema>;
export type LoginUserRequestDto = z.infer<typeof loginSchema>;
