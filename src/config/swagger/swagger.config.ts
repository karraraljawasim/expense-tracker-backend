import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { swaggerRegistry } from "./swagger.registry.js";

import "../../modules/auth/auth.docs.js";
import "../../modules/budgetAlert/budgetAlert.docs.js";
import "../../modules/categories/category.docs.js";
import "../../modules/expenses/expenes.docs.js";
import "../../modules/reports/report.docs.js";

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(swaggerRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Expense Tracker API",
      version: "1.0",
    },
    servers: [{ url: "http://localhost:8080/api/" }],

    security: [{ bearerAuth: [] }],
  });
}
