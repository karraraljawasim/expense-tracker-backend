import { RateLimiterRedis } from "rate-limiter-flexible";
import { initializeRedisClient } from "../config/redis/redis.client.js";
import type { Response, Request, NextFunction } from "express";
import REDIS_KEY from "../config/redis/redis.keys.js";

const client = await initializeRedisClient();
const tokenBucket = new RateLimiterRedis({
  storeClient: client,
  useRedisPackage: true,
  points: 30,
  duration: 20,
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const key = REDIS_KEY.rateLimiter(req.user?.id, req.ip);

  try {
    const result = await tokenBucket.consume(key);
    res.set({
      "RateLimit-Remaining": String(result.remainingPoints),
      "RateLimit-Reset": String(Date.now() + result.msBeforeNext),
    });

    next();
  } catch (error: any) {
    if (error?.remainingPoints !== undefined) {
      res.set({
        "Retry-After": String(Math.ceil(error.msBeforeNext / 1000)),
        "RateLimit-Remaining": "0",
      });

      res.status(429).json({
        success: false,
        message: "Too many request. Please try later",
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      });

      return;
    }

    console.error("rate limiter error: ", error);
    next();
  }
};
