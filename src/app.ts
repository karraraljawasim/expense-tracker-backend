import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware.js";
import { categoryRouter } from "./modules/categories/category.routes.js";
import { expenseRouter } from "./modules/expenses/expense.route.js";
import { budgetAlertRouter } from "./modules/budgetAlert/budgetAlert.routes.js";
import { reportRouter } from "./modules/reports/report.routes.js";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter.middleware.js";
import { authenticate } from "./middlewares/auth.middlewares.js";
import { generateOpenAPIDocument } from "./config/swagger/swagger.config.js";

// @ts-ignore
const openApiDocument = new generateOpenAPIDocument();
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api-docs.json", (_req, res) => {
  res.json(openApiDocument);
});
app.use("/api/auth", authRouter);
app.use("/api/categories", authenticate, rateLimiterMiddleware, categoryRouter);
app.use("/api/expenses", authenticate, rateLimiterMiddleware, expenseRouter);
app.use("/api/budgets", authenticate, rateLimiterMiddleware, budgetAlertRouter);
app.use("/api/reports", authenticate, rateLimiterMiddleware, reportRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use(globalErrorHandler);

export default app;
