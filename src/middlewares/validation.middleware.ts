import { type ZodSchema, z } from "zod";
import type { Request, Response, NextFunction } from "express";

type RequestLocation = "body" | "params" | "query";

export const validate = <T extends ZodSchema>(
  schmea: T,
  location: RequestLocation = "body",
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schmea.safeParse(req[location]);

    if (!result.success) {
      next(result.error);
      return;
    }

    req[location] = result.data as z.infer<T>;
    next();
  };
};
