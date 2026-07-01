import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const swaggerRegistry = new OpenAPIRegistry();

swaggerRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
