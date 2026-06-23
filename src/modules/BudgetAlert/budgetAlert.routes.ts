import { Router } from "express";
import { BudgetAlertController } from "./budgetAlert.controller.js";
import { BudgetAlertService } from "./budgetAlert.service.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  budgetAlertIdPramsSchema,
  getAllTriggeredAlertsQuerySchema,
  getHistoryBudgetAlertByMonthQuerySchema,
} from "./budgetAlert.validation.js";

const budgetAlertController = new BudgetAlertController(
  new BudgetAlertService(),
);

export const budgetAlertRouter = Router();

budgetAlertRouter.route("/").get(budgetAlertController.getMonthlyBudgetStatus);

budgetAlertRouter
  .route("/alerts")
  .get(
    validate(getAllTriggeredAlertsQuerySchema, "query"),
    budgetAlertController.getAllTriggeredAlerts,
  );

budgetAlertRouter
  .route("/alerts/:budgetAlertId/read")
  .patch(
    validate(budgetAlertIdPramsSchema, "params"),
    budgetAlertController.markBudgetAlertAsRead,
  );

budgetAlertRouter
  .route("/alerts/read-all")
  .patch(budgetAlertController.markAllBudgetAlertAsRead);

budgetAlertRouter
  .route("/history")
  .get(
    validate(getHistoryBudgetAlertByMonthQuerySchema, "query"),
    budgetAlertController.getHistoryBudgetAlertByMonth,
  );
