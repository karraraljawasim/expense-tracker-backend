import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { swaggerRegistry } from "../../config/swagger/swagger.registry.js";
import {
  createExpenseSchema,
  expenseIdPramsSchema,
  getAllExpensesQuerySchema,
  updateExpenseSchema,
} from "./expense.validation.js";

extendZodWithOpenApi(z);

swaggerRegistry.registerPath({
  method: "post",
  path: "/expenses",
  tags: ["expenses"],
  summary: "Create new expense",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createExpenseSchema,
          example: {
            categoryId: "Your category mongoose id",
            amount: 49.99,
            currency: "USD",
            note: "Lunch with team",
            date: "2027-01-15",
            isRecurring: true,
            recurrence: {
              frequency: "weekly",
              interval: 3,
              startDate: "2027-01-15",
              endDate: null,
              parentId: null,
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Create new expense, and return it",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Category not found",
    },
  },
});

swaggerRegistry.registerPath({
  method: "get",
  path: "/expenses",
  tags: ["expenses"],
  summary: "Get all expense",
  request: {
    query: getAllExpensesQuerySchema,
  },
  responses: {
    200: {
      description: "Return list of expenses",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

swaggerRegistry.registerPath({
  method: "get",
  path: "/expenses/{expenseId}",
  tags: ["expenses"],
  summary: "Get expense details",
  request: {
    params: expenseIdPramsSchema,
  },
  responses: {
    200: {
      description: "Return expense details",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Expense not found",
    },
  },
});

swaggerRegistry.registerPath({
  method: "patch",
  path: "/expenses/{expenseId}",
  tags: ["expenses"],
  summary: "Update expense",
  request: {
    params: expenseIdPramsSchema,
    body: {
      content: {
        "application/json": {
          schema: updateExpenseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update expense successfully, and return it",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Expense not found",
    },
  },
});

swaggerRegistry.registerPath({
  method: "patch",
  path: "/expenses/{expenseId}/soft-delete",
  tags: ["expenses"],
  summary: "Soft deleted expense",
  request: {
    params: expenseIdPramsSchema,
    body: {
      content: {
        "application/json": {
          schema: updateExpenseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Soft deleted to expense successfully, and return it",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Expense not found",
    },
  },
});
