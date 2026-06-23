import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UnauthorizedError } from "../utils/AppError.js";
import { jwtUtils } from "../utils/jwt.js";
import { isTokenBlacklisted } from "../modules/auth/auth.cache.js";

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer")) {
      throw new UnauthorizedError("Missing authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Missing token");
    }
    const isBlacklisted = await isTokenBlacklisted(token);

    if (isBlacklisted) {
      throw new UnauthorizedError("Token is revoked");
    }

    try {
      const payload = jwtUtils.verifyAccessToken(token);
      req.user = { ...payload.sub };
      next();
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  },
);
