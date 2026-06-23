import mongoose, { Schema, model } from "mongoose";
import { Category } from "./category.types.js";

const categorySchema = new Schema<Category>(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#6B7280",
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    budgetLimit: {
      type: Number,
      default: 0,
      min: [0, "Budget limit must be a positive number"],
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

//Indexes
categorySchema.index({ userId: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

const Categories = model<Category>("Categories", categorySchema);

export { Categories };
