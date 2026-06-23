import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes.js";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware.js";
import { categoryRouter } from "./modules/categories/category.routes.js";
import { expenseRouter } from "./modules/expenses/expense.route.js";
import { budgetAlertRouter } from "./modules/budgetAlert/budgetAlert.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { reportRouter } from "./modules/reports/report.routes.js";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter.middleware.js";
import { authenticate } from "./middlewares/auth.middlewares.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/categories", authenticate, rateLimiterMiddleware, categoryRouter);
app.use("/api/expenses", authenticate, rateLimiterMiddleware, expenseRouter);
app.use("/api/budgets", authenticate, rateLimiterMiddleware, budgetAlertRouter);
app.use("/api/admin/users", authenticate, rateLimiterMiddleware, userRouter);
app.use("/api/reports", authenticate, rateLimiterMiddleware, reportRouter);

app.use(globalErrorHandler);

export default app;
