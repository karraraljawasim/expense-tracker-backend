import { Router } from "express";
import { BudgetAlertController } from "./budgetAlert.controller.js";
import { BudgetAlertService } from "./budgetAlert.service.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  budgetAlertIdPramseSchema,
  getAllTriggeredAlertsQueryschema,
  getHistoryBudgetAlertByMonthQuerySchema,
} from "./budgetAlert.validation.js";

const budgetAlertController = new BudgetAlertController(
  new BudgetAlertService(),
);

export const budgetAlertRouter = Router();

budgetAlertRouter
  .route("/")
  .get(authenticate, budgetAlertController.getMonthlyBudgetStatus);

budgetAlertRouter
  .route("/alerts")
  .get(
    authenticate,
    validate(getAllTriggeredAlertsQueryschema, "query"),
    budgetAlertController.getAllTriggeredAlerts,
  );

budgetAlertRouter
  .route("/alerts/:budgetAlertId/read")
  .patch(
    authenticate,
    validate(budgetAlertIdPramseSchema, "params"),
    budgetAlertController.markBudgetAlertAsRead,
  );

budgetAlertRouter
  .route("/alerts/read-all")
  .patch(authenticate, budgetAlertController.markAllBudgetAlertAsRead);

budgetAlertRouter
  .route("/history")
  .get(
    authenticate,
    validate(getHistoryBudgetAlertByMonthQuerySchema, "query"),
    budgetAlertController.getHistoryBudgetAlertByMonth,
  );
