import mongoose from "mongoose";
import {
  AppError,
  GoneError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/AppError.js";
import {
  checkBudgetAlert,
  computeAmountInBaseCurrency,
  createFilterObject,
} from "../../helpers/expense.helper.js";
import { Categories } from "../categories/category.model.js";
import { Expense } from "./expense.model.js";
import {
  GetExpenseByIdResponseDto,
  IExpense,
  IGetAllExpensesFilter,
} from "./expense.types.js";
import {
  CreateExpenseRequestDto,
  GetAllExpensesQueryDto,
  UpdateExpenseRequestDto,
} from "./expense.validation.js";
import { PaginationResponseDto } from "../../types/pagination.js";
import { calculateStartDateInMidnight } from "../../utils/date.calculate.js";
import { clearCachedSummary } from "../reports/report.cache.js";

let exchangeRate = 1;
export interface IExpenseService {
  create: (input: CreateExpenseRequestDto, userId: string) => Promise<IExpense>;
  getAll: (
    query: GetAllExpensesQueryDto,
    userId: string,
  ) => Promise<PaginationResponseDto<IExpense>>;
  getById: (
    expenseId: string,
    userId: string,
  ) => Promise<GetExpenseByIdResponseDto>;
  update: (
    expenseId: string,
    input: UpdateExpenseRequestDto,
    userId: string,
  ) => Promise<IExpense>;
  softDelete: (
    expenseId: string,
    userId: string,
    deleteScope?: "this" | "all" | "thisAndFuture",
  ) => Promise<void>;
}

export class ExpenseService implements IExpenseService {
  async create(input: CreateExpenseRequestDto, userId: string) {
    const category = await Categories.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError("Category");
    }
    if (category.userId.toString() !== userId) {
      throw new UnauthorizedError("You not the owner to this category");
    }

    const amountInBaseCurrency = computeAmountInBaseCurrency(
      exchangeRate,
      input.amount,
    );

    let newExpense;

    if (input.isRecurring) {
      if (!input.recurrence || Object.keys(input.recurrence).length === 0) {
        throw new AppError("Recurrence object required", 400);
      }

      const startDate = calculateStartDateInMidnight(
        input.recurrence.startDate,
      );

      if (startDate < new Date()) {
        throw new AppError("Start date must not be in the past", 400);
      }

      if (input.recurrence.endDate) {
        if (
          new Date(input.recurrence.endDate) <
          new Date(input.recurrence.startDate)
        ) {
          throw new AppError("End date must be after start date", 400);
        }
      }
      if (input.recurrence.interval < 1) {
        throw new AppError("Interval must be 1 or more", 400);
      }

      newExpense = await Expense.create({
        ...input,
        userId: userId,
        amountInBaseCurrency,
        exchangeRateUsed: exchangeRate,
        isRecurring: true,
        recurrence: {
          frequency: input.recurrence.frequency,
          interval: input.recurrence.interval,
          startDate: input.recurrence.startDate,
          endDate: input.recurrence.endDate,
          nextRunAt: input.recurrence.startDate,
          parentId: null,
        },
      });
    } else {
      newExpense = await Expense.create({
        ...input,
        userId: userId,
        amountInBaseCurrency,
        exchangeRateUsed: exchangeRate,
      });
    }

    await clearCachedSummary(userId);
    await checkBudgetAlert(userId, input.categoryId);

    return newExpense;
  }

  async getAll(query: GetAllExpensesQueryDto, userId: string) {
    if (query.categoryId) {
      const category = await Categories.findById(query.categoryId);
      if (!category || category.userId.toString() !== userId) {
        throw new NotFoundError("Category");
      }
    }

    const filterObject: IGetAllExpensesFilter = createFilterObject(
      query,
      userId,
    );

    const page = parseInt(query.page, 10) || 1;
    const pageSize = parseInt(query.pageSize, 10) || 10;

    const expenses = await Expense.aggregate([
      {
        $match: { ...filterObject },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $facet: {
          metaData: [{ $count: "totalCount" }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ]);

    const totalCount = expenses[0]?.metaData[0]?.totalCount || 0;

    return {
      data: expenses[0].data,
      metaData: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async getById(expenseId: string, userId: string) {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new NotFoundError("Expense");
    }

    if (expense.userId.toString() !== userId) {
      throw new NotFoundError("Expense");
    }

    if (expense.isDeleted) {
      throw new GoneError("Expense");
    }

    if (expense.isRecurring && expense.recurrence?.parentId === null) {
      const subExpenses = await Expense.find({
        userId: new mongoose.Types.ObjectId(userId),
        "recurrence.parentId": expense._id,
        isDeleted: false,
      })
        .select({
          _id: 1,
          date: 1,
          amount: 1,
          "recurrence.nextRunAt": 1,
        })
        .limit(6);

      return {
        _id: expense._id,
        note: expense.note,
        amount: expense.amount,
        currency: expense.currency,
        isRecurring: true,
        attachmentUrl: expense.attachmentUrl,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        history: {
          totalCount: subExpenses.length,
          totalSpent: subExpenses.reduce((sum, value) => sum + value.amount, 0),
          recentCopies: subExpenses,
        },
      };
    }

    return expense;
  }

  async update(
    expenseId: string,
    input: UpdateExpenseRequestDto,
    userId: string,
  ) {
    const expense = await Expense.findById(expenseId);

    if (!expense || expense?.userId.toString() !== userId) {
      throw new NotFoundError("Expense");
    }

    if (expense.isDeleted) {
      throw new GoneError("Expense");
    }

    if (!input.editScope && expense.isRecurring) {
      throw new AppError("Edit Scope required in Recurring expense", 400);
    }

    if (
      !expense.isRecurring &&
      expense.recurrence?.parentId === null &&
      input.editScope === undefined
    ) {
      let amountInBaseCurrency;
      if (
        (input.amount !== expense.amount && input.amount) ||
        (expense.currency !== input.currency && input.currency)
      ) {
        amountInBaseCurrency = computeAmountInBaseCurrency(
          input.amount ? input.amount : expense.amount,
          exchangeRate,
        );
      }

      await Expense.findByIdAndUpdate(expenseId, {
        ...input,
        amountInBaseCurrency: amountInBaseCurrency,
      });

      await checkBudgetAlert(userId, expense.categoryId.toString());

      const updatedExpense = await Expense.findById(expenseId);
      if (!updatedExpense) {
        throw new AppError("Update expense failed");
      }

      await clearCachedSummary(userId);
      return updatedExpense;
    }

    if (
      expense.isRecurring === false &&
      expense.recurrence?.parentId !== null &&
      input.editScope === undefined
    ) {
      let amountInBaseCurrency;
      if (
        (input.amount !== expense.amount && input.amount) ||
        (input.currency !== expense.currency && input.currency)
      ) {
        amountInBaseCurrency = computeAmountInBaseCurrency(
          input.amount ? input.amount : expense.amount,
          exchangeRate,
        );
      }

      await Expense.findByIdAndUpdate(expenseId, {
        ...input,
        amountInBaseCurrency: amountInBaseCurrency,
      });

      await checkBudgetAlert(userId, expense.categoryId.toString());

      const updatedExpense = await Expense.findById(expenseId);
      if (!updatedExpense) {
        throw new AppError("Update expense failed");
      }

      await clearCachedSummary(userId);
      return updatedExpense;
    }

    if (expense.isRecurring && input.editScope) {
      if (input.editScope === "this") {
        let amountInBaseCurrency;
        if (
          (input.amount !== expense.amount && input.amount) ||
          (input.currency !== expense.currency && input.currency)
        ) {
          amountInBaseCurrency = computeAmountInBaseCurrency(
            input.amount ? input.amount : expense.amount,
            exchangeRate,
          );
        }

        await Expense.findByIdAndUpdate(expenseId, {
          ...input,
          amountInBaseCurrency: amountInBaseCurrency,
        });

        const updatedExpense = await Expense.findById(expenseId);
        if (!updatedExpense) {
          throw new AppError("Update expense failed");
        }

        await clearCachedSummary(userId);
        return updatedExpense;
      }

      if (input.editScope === "thisAndFuture") {
        let amountInBaseCurrency;
        if (
          (input.amount !== expense.amount && input.amount) ||
          (input.currency !== expense.currency && input.currency)
        ) {
          amountInBaseCurrency = computeAmountInBaseCurrency(
            input.amount ? input.amount : expense.amount,
            exchangeRate,
          );
        }

        await Expense.findByIdAndUpdate(expenseId, {
          ...input,
          amountInBaseCurrency,
          "recurrence.nextRunAt": new Date(),
        });

        await Expense.updateMany(
          {
            "recurrence.parentId": expenseId,
            date: { $gte: new Date() },
          },
          {
            isDeleted: true,
          },
        );
      }
      if (input.editScope === "all") {
        let amountInBaseCurrency;
        if (
          (input.amount !== expense.amount && input.amount) ||
          (input.currency !== expense.currency && input.currency)
        ) {
          amountInBaseCurrency = computeAmountInBaseCurrency(
            input.amount ? input.amount : expense.amount,
            exchangeRate,
          );
        }

        await Expense.findByIdAndUpdate(expenseId, {
          ...input,
          amountInBaseCurrency: amountInBaseCurrency,
        });

        const allCopies = await Expense.find({
          "recurrence.parentId": expenseId,
          isDeleted: false,
        });

        await Expense.updateMany(
          { "recurrence.parentId": expenseId },
          { ...input, amountInBaseCurrency: amountInBaseCurrency },
        );

        const uniqueMonths = [
          ...new Set(
            allCopies.map((copy) => copy.date.toISOString().slice(0, 7)),
          ),
        ];

        for (const month of uniqueMonths) {
          await checkBudgetAlert(
            userId,
            expense.categoryId.toString(),
            new Date(month),
          );
        }

        const updatedExpense = await Expense.findById(expenseId);
        if (!updatedExpense) {
          throw new AppError("Update expense failed");
        }

        await clearCachedSummary(userId);
        return updatedExpense;
      }
    }

    throw new AppError("Update this expense not allowed");
  }

  async softDelete(
    expenseId: string,
    userId: string,
    deleteScope?: "this" | "all" | "thisAndFuture",
  ) {
    const expense = await Expense.findOne({ _id: expenseId });
    if (!expense) {
      throw new NotFoundError("Expense");
    }

    if (expense.userId.toString() !== userId) {
      throw new UnauthorizedError("You not owner to this expense");
    }
    if (expense.isDeleted) {
      throw new GoneError("Expense");
    }
    if (!expense.isRecurring && expense.recurrence?.parentId === null) {
      await Expense.findByIdAndUpdate(expenseId, {
        isDeleted: true,
      });

      await checkBudgetAlert(userId, expense.categoryId.toString());

      await clearCachedSummary(userId);
      return;
    }

    if (expense.isRecurring && expense.recurrence?.parentId !== null) {
      await Expense.findByIdAndUpdate(expenseId, {
        isDeleted: true,
      });

      await checkBudgetAlert(
        userId,
        expense.categoryId.toString(),
        expense.date,
      );

      await clearCachedSummary(userId);
      return;
    }

    if (expense.isRecurring && expense.recurrence?.parentId === null) {
      if (!deleteScope) {
        throw new AppError(
          "Delete scope is required in  deleted recurring expense",
        );
      }

      if (deleteScope === "this") {
        await Expense.findByIdAndUpdate(expenseId, {
          isDeleted: true,
          "recurrence.endDate": new Date(),
        });

        await clearCachedSummary(userId);
        return;
      }

      if (deleteScope === "thisAndFuture") {
        await Expense.findByIdAndUpdate(expenseId, {
          isDeleted: true,
        });

        await Expense.updateMany(
          {
            "recurrence.parentId": expenseId,
            date: { $gte: new Date() },
          },
          {
            isDeleted: true,
          },
        );

        await clearCachedSummary(userId);
        return;
      }

      if (deleteScope === "all") {
        await Expense.findByIdAndUpdate(expenseId, {
          isDeleted: true,
        });

        const copiesToDelete = await Expense.find({
          "recurrence.parentId": expenseId,
          isDeleted: true,
        });

        await Expense.updateMany(
          {
            "recurrence.parentId": expenseId,
          },
          {
            isDeleted: true,
          },
        );

        const uniqueMonths = [
          ...new Set(
            copiesToDelete.map((copy) => copy.date.toISOString().slice(0, 7)),
          ),
        ];

        for (const month of uniqueMonths) {
          await checkBudgetAlert(
            userId,
            expense.categoryId.toString(),
            new Date(month),
          );
        }

        await clearCachedSummary(userId);
        return;
      }
    }
  }
}
