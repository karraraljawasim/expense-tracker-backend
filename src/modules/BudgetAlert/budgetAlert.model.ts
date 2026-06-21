import { Schema, model } from "mongoose";
import { IBudgetAlert } from "./budgetAlert.types.js";

const budgetAlertSchema = new Schema<IBudgetAlert>(
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
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    budgetLimit: {
      type: Number,
      required: true,
    },
    spentAmount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    alertType: {
      type: String,
      enum: ["warning", "exceeded"],
      required: true,
    },
    triggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
budgetAlertSchema.index({ userId: 1, month: 1 });
budgetAlertSchema.index({ triggered: 1 });
budgetAlertSchema.index(
  { userId: 1, categoryId: 1, month: 1, alertType: 1 },
  { unique: true },
);

export const BudgetAlert = model<IBudgetAlert>(
  "BudgetAlert",
  budgetAlertSchema,
);
