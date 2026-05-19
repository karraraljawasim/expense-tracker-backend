import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.validation.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";

const authController = new AuthController(new AuthService());

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);

authRouter.post("/login", validate(loginSchema), authController.login);

authRouter.post("/logout", authenticate, authController.logout);

authRouter.post("/logout-all", authenticate, authController.logoutAll);

authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
