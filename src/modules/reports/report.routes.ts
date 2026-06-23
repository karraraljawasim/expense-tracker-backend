import { Router } from "express";
import { ReportController } from "./report.controller.js";
import { ReportService } from "./report.service.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  getMonthlyReportQuerySchema,
  getSummaryBodySchema,
} from "./report.validation.js";
import { categoryIdParamsSchema } from "../categories/category.validation.js";

const reportController = new ReportController(new ReportService());
export const reportRouter = Router();

reportRouter
  .route("/monthly")
  .get(
    validate(getMonthlyReportQuerySchema, "query"),
    reportController.getMonthlyReport,
  );

reportRouter
  .route("/categories/:categoryId")
  .get(
    validate(categoryIdParamsSchema, "params"),
    reportController.getExpenseReportByCategory,
  );

reportRouter
  .route("/summary")
  .get(validate(getSummaryBodySchema), reportController.getSummary);
