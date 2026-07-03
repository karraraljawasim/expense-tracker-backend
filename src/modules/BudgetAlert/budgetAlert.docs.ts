import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { swaggerRegistry } from "../../config/swagger/swagger.registry.js";
import {
  getAllTriggeredAlertsQuerySchema,
  budgetAlertIdPramsSchema,
  getHistoryBudgetAlertByMonthQuerySchema,
} from "./budgetAlert.validation.js";

extendZodWithOpenApi(z);

swaggerRegistry.registerPath({
  method: "get",
  path: "/budgets",
  tags: ["budgetAlert"],
  summary: "Get monthly budget status",
  security: [{ bearerAuth: [] }],
  request: {
    query: getAllTriggeredAlertsQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully logged budget alert status",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

swaggerRegistry.registerPath({
  method: "get",
  path: "/budgets/alerts",
  tags: ["budgetAlert"],
  summary: "Get all triggered alerts in month",
  security: [{ bearerAuth: [] }],
  request: {
    query: getAllTriggeredAlertsQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully logged all triggered alerts",
    },
    401: {
      description: "Unauthorized",
    },
    400: {
      description: "Validation failed",
    },
  },
});

swaggerRegistry.registerPath({
  method: "patch",
  path: "/budgets/alerts/{budgetAlertId}/read",
  tags: ["budgetAlert"],
  summary: "Mark alerts is read",
  security: [{ bearerAuth: [] }],
  request: {
    params: budgetAlertIdPramsSchema,
  },
  responses: {
    200: {
      description: "Successfully mark alert is read",
    },
    401: {
      description: "Unauthorized",
    },
    400: {
      description: "Validation failed",
    },
  },
});

swaggerRegistry.registerPath({
  method: "patch",
  path: "/budgets/alerts/read-all",
  tags: ["budgetAlert"],
  summary: "Mark all alerts is read",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Successfully mark all alerts is read",
      content: {
        "application/json": {
          schema: z.object({
            countUpdated: z
              .number()
              .openapi({ description: "Number or marked alerts" }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});

swaggerRegistry.registerPath({
  method: "get",
  path: "/budgets/history",
  tags: ["budgetAlert"],
  summary: "Get history summary alerts by month",
  security: [{ bearerAuth: [] }],
  request: {
    query: getHistoryBudgetAlertByMonthQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully return summary alerts",
    },
    401: {
      description: "Unauthorized",
    },
  },
});
