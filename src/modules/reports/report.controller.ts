import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { IReportService } from "./report.service.js";
import { getMonthlyReportQuerySchema } from "./report.validation.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export class ReportController {
  readonly #ReportService: IReportService;

  constructor(reportService: IReportService) {
    this.#ReportService = reportService;
  }

  getMonthlyReport = asyncHandler(async (req, res) => {
    const query = req.validateQuery as z.infer<
      typeof getMonthlyReportQuerySchema
    >;
    const data = await this.#ReportService.getMonthlyReport(
      query,
      req.user!.id,
    );

    ApiResponse.success(res, data);
  });

  getExpenseReportByCategory = asyncHandler(async (req, res) => {
    const data = await this.#ReportService.getExpenseReportByCategory(
      req.params.categoryId as string,
      req.user!.id,
    );

    ApiResponse.success(res, data);
  });

  getSummary = asyncHandler(async (req, res) => {
    const data = await this.#ReportService.getSummary(
      req.user!.id,
      req.body.thisMonthBudget,
    );

    ApiResponse.success(res, data);
  });
}
