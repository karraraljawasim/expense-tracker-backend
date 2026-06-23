import crypto from "crypto";
import REDIS_KEY from "../../config/redis/redis.keys.js";
import { initializeRedisClient } from "../../config/redis/redis.client.js";

const redisClient = await initializeRedisClient();

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const hash = hashToken(token);
  const key = REDIS_KEY.auth.blacklist(hash);
  const exist = await redisClient.exists(key);

  return exist === 1;
}

export async function blacklistToken(
  token: string,
  remainingTtl: number,
): Promise<void> {
  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) return;

  const hash = hashToken(token);
  const key = REDIS_KEY.auth.blacklist(hash);
  await redisClient.set(key, "1", { EX: remainingTtl });
}
