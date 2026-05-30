import mongoose, { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
    },
    budgetLimit: {
      type: Number,
      required: true,
      min: [0, "Budget limit must be a positive number"],
    },
    currency: {
      type: String,
      required: true,
      enum: ["USD", "IQD"],
    },
  },
  { timestamps: true },
);

const Categories = model("Categories", categorySchema);

export default Categories;
