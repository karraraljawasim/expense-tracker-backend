import { Router } from "express";
import { ExpenseController } from "./expense.controller.js";
import { ExpenseService } from "./expense.service.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  createExpenseSchema,
  getAllExpensesQuerySchema,
} from "./expense.validation.js";

const expenseController = new ExpenseController(new ExpenseService());

export const expenseRouter = Router();

expenseRouter
  .route("/")
  .post(authenticate, validate(createExpenseSchema), expenseController.create)
  .get(
    authenticate,
    validate(getAllExpensesQuerySchema, "query"),
    expenseController.getAll,
  );
