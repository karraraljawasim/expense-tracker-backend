import { z } from "zod";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { IBudgetAlertService } from "./budgetAlert.service.js";
import {
  getAllTriggeredAlertsQuerySchema,
  getHistoryBudgetAlertByMonthQuerySchema,
} from "./budgetAlert.validation.js";

export class BudgetAlertController {
  readonly #budgetAlertService: IBudgetAlertService;

  constructor(budgetAlertService: IBudgetAlertService) {
    this.#budgetAlertService = budgetAlertService;
  }

  getMonthlyBudgetStatus = asyncHandler(async (req, res) => {
    const data = await this.#budgetAlertService.getMonthlyBudgetStatus(
      req.user!.id,
    );

    ApiResponse.success(res, data);
  });

  getAllTriggeredAlerts = asyncHandler(async (req, res) => {
    const query = req.validateQuery as z.infer<
      typeof getAllTriggeredAlertsQuerySchema
    >;
    const data = await this.#budgetAlertService.getAllTriggeredAlerts(
      req.user!.id,
      query,
    );

    ApiResponse.success(res, data);
  });

  markBudgetAlertAsRead = asyncHandler(async (req, res) => {
    const data = await this.#budgetAlertService.markBudgetAlertAsRead(
      req.user!.id,
      req.params.budgetAlertId as string,
    );

    ApiResponse.success(res, data);
  });

  markAllBudgetAlertAsRead = asyncHandler(async (req, res) => {
    const data = await this.#budgetAlertService.markAllBudgetAlertAsRead(
      req.user!.id,
    );

    ApiResponse.success(res, data);
  });

  getHistoryBudgetAlertByMonth = asyncHandler(async (req, res) => {
    const query = req.validateQuery as z.infer<
      typeof getHistoryBudgetAlertByMonthQuerySchema
    >;
    const data = await this.#budgetAlertService.getHistoryBudgetAlertByMonth(
      req.user!.id,
      query,
    );

    ApiResponse.success(res, data);
  });
}
