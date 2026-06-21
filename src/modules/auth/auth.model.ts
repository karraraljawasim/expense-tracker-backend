import mongoose, { Schema, model } from "mongoose";
import { IRefreshToken } from "./auth.types.js";
import { env } from "../../config/env.js";

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: env.NODE_ENV === "test" ? false : true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
refreshTokenSchema.index({ userId: 1 });

export const RefreshToken = model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
);
