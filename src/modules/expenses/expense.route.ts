import { Router } from "express";
import { ExpenseController } from "./expense.controller.js";
import { ExpenseService } from "./expense.service.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  createExpenseSchema,
  expenseIdPramsSchema,
  expenseSoftDeleteQuerySchema,
  getAllExpensesQuerySchema,
  updateExpenseSchema,
} from "./expense.validation.js";

const expenseController = new ExpenseController(new ExpenseService());

export const expenseRouter = Router();

expenseRouter
  .route("/")
  .post(validate(createExpenseSchema), expenseController.create)
  .get(validate(getAllExpensesQuerySchema, "query"), expenseController.getAll);

expenseRouter
  .route("/:expenseId")
  .get(validate(expenseIdPramsSchema, "params"), expenseController.getById)
  .patch(
    validate(expenseIdPramsSchema, "params"),
    validate(updateExpenseSchema),
    expenseController.update,
  )
  .delete(
    validate(expenseIdPramsSchema, "params"),
    validate(expenseSoftDeleteQuerySchema, "query"),
    expenseController.softDelete,
  );
