import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { ZodError } from "zod";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "validation Error",
      error: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });

    return;
  }

  console.error(`Unhandler Error`);

  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
};
