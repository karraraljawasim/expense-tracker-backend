import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected successfully`);
  } catch (error) {
    console.error(`MongoDB connection error`, error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn(`MongoDB disconnected, Attempting to reconnect...`);
});

mongoose.connection.on("error", (err) => {
  console.error(`Database error: ${err}`);
});
