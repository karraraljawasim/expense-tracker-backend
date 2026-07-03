import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { swaggerRegistry } from "../../config/swagger/swagger.registry.js";
import {
  categoryIdParamsSchema,
  createCategorySchema,
  paginateQuery,
  updateCategorySchema,
} from "./category.validation.js";

extendZodWithOpenApi(z);

swaggerRegistry.registerPath({
  method: "post",
  path: "/categories",
  tags: ["categories"],
  security: [{ bearerAuth: [] }],
  summary: "Create new category",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCategorySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Create new category success, and returns it",
    },
    409: {
      description: "Category name already exists",
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
  path: "/categories",
  tags: ["categories"],
  security: [{ bearerAuth: [] }],
  summary: "Get categories",
  request: {
    query: paginateQuery,
  },
  responses: {
    200: {
      description: " Return list of categories",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

swaggerRegistry.registerPath({
  method: "get",
  path: "/categories/{categoryId}",
  tags: ["categories"],
  security: [{ bearerAuth: [] }],
  summary: "Get category details",
  request: {
    params: categoryIdParamsSchema,
  },
  responses: {
    200: {
      description: " Return category details",
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
  method: "patch",
  path: "/categories/{categoryId}",
  tags: ["categories"],
  security: [{ bearerAuth: [] }],
  summary: "Update category",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCategorySchema,
        },
      },
    },
    params: categoryIdParamsSchema,
  },
  responses: {
    200: {
      description: "Update category successfully, and returns it",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Category not found",
    },
    400: {
      description: "Validation failed",
    },
  },
});

swaggerRegistry.registerPath({
  method: "put",
  path: "/categories/{categoryId}",
  tags: ["categories"],
  security: [{ bearerAuth: [] }],
  summary: "Soft deleted to category",
  request: {
    params: categoryIdParamsSchema,
  },
  responses: {
    200: {
      description: "Soft deleted category successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Category not found",
    },
  },
});
