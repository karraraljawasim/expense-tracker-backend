import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { swaggerRegistry } from "../../config/swagger/swagger.registry.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

extendZodWithOpenApi(z);

swaggerRegistry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register to app (Create new account)",
  security: [],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Create new account successfully",
      content: {
        "application/json": {
          schema: z.object({
            refreshToken: z.string(),
            accessToken: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Validation failure",
    },
    409: {
      description: "User already exists",
    },
  },
});

swaggerRegistry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login to app",
  security: [],
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successfully",
      content: {
        "application/json": {
          schema: z.object({
            refreshToken: z.string(),
            accessToken: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Validation failure",
    },
    401: {
      description: "Invalid email or password",
    },
  },
});

swaggerRegistry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout from the app",
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Logout successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

swaggerRegistry.registerPath({
  method: "post",
  path: "/auth/logout-all",
  tags: ["Auth"],
  summary: "Logout all from the app",
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Logout all successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

swaggerRegistry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  security: [],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            refreshToken: z.string().optional().openapi({
              description: "Only for Swagger testing — normally sent as cookie",
              example: "eyJhbGci...",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Refresh access token successfully",
      content: {
        "application/json": {
          schema: z.object({
            accessToken: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized — token missing or revoked",
    },
  },
});
