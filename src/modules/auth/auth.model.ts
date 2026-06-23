import mongoose, { Schema, model } from "mongoose";
import { IRefreshToken } from "./auth.types.js";

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    hashedToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ hashedToken: 1 });

export const RefreshToken = model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
);
