import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { rateLimiterMiddleware } from "../../middlewares/rateLimiter.middleware.js";

const authController = new AuthController(new AuthService());

export const authRouter = Router();

authRouter.post(
  "/register",
  rateLimiterMiddleware,
  validate(registerSchema),
  authController.register,
);

authRouter.post(
  "/login",
  rateLimiterMiddleware,
  validate(loginSchema),
  authController.login,
);

authRouter.post(
  "/logout",
  authenticate,
  rateLimiterMiddleware,
  authController.logout,
);

authRouter.post(
  "/logout-all",
  authenticate,
  rateLimiterMiddleware,
  authController.logoutAll,
);

authRouter.post("/refresh", rateLimiterMiddleware, authController.refresh);
