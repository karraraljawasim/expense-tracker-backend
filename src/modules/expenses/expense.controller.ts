import z from "zod";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ExpenseService } from "./expense.service.js";
import { getAllExpensesQuerySchema } from "./expense.validation.js";

export class ExpenseController {
  readonly #expenseService: ExpenseService;

  constructor(expenseService: ExpenseService) {
    this.#expenseService = expenseService;
  }

  create = asyncHandler(async (req, res) => {
    const data = await this.#expenseService.create(req.body, req.user!.id);

    ApiResponse.create(res, data);
  });

  getAll = asyncHandler(async (req, res) => {
    const query = req.validateQuery as z.infer<
      typeof getAllExpensesQuerySchema
    >;
    const data = await this.#expenseService.getAll(query, req.user!.id);

    ApiResponse.success(res, data);
  });
}
