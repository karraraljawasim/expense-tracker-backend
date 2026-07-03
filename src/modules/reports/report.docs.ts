import { swaggerRegistry } from "../../config/swagger/swagger.registry.js";
import {
  getMonthlyReportQuerySchema,
  getSummaryQuerySchema,
} from "./report.validation.js";
import { categoryIdParamsSchema } from "../categories/category.validation.js";

swaggerRegistry.registerPath({
  method: "get",
  path: "/reports/monthly",
  tags: ["reports"],
  summary: "Get monthly expense report",
  request: {
    query: getMonthlyReportQuerySchema,
  },
  responses: {
    200: {
      description: "Return monthly report successfully",
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
  method: "get",
  path: "/reports/summary",
  tags: ["reports"],
  summary: "Get current month summary",
  request: {
    query: getSummaryQuerySchema,
  },
  responses: {
    200: {
      description: "Return summary successfully",
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
  method: "get",
  path: "/reports/categories/{categoryId}",
  tags: ["reports"],
  summary: "Get report by category",
  request: {
    params: categoryIdParamsSchema,
  },
  responses: {
    200: {
      description: "Return report successfully",
    },
    401: {
      description: "Unauthorized",
    },
    400: {
      description: "Validation failed",
    },
    404: {
      description: "Category not found",
    },
  },
});
