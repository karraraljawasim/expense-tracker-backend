// src/modules/expenses/expense.model.ts

import { model, Schema } from "mongoose";
import { IRecurrence, IExpense } from "./expense.types.js";

const recurrenceSchema = new Schema<IRecurrence>(
  {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    interval: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
    },
  },
  { _id: false },
);

const expenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Categories",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      uppercase: true,
      default: "USD",
    },
    amountInBaseCurrency: {
      type: Number,
      required: true,
    },
    exchangeRateUsed: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      type: recurrenceSchema,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

//Indexes
expenseSchema.index({ userId: 1 });
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
