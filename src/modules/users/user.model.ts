import { Schema, model } from "mongoose";
import { IUser } from "./user.types.js";

const userShema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      min: [8, "Too short password"],
    },
    currency: {
      type: String,
      uppercase: true,
      default: "USD",
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Users = model<IUser>("Users", userShema);
