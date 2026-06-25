import { createClient, type RedisClientType } from "redis";
import { env } from "../env.js";

let client: RedisClientType | null = null;

export async function initializeRedisClient() {
  if (!client) {
    client = createClient({ url: env.REDIS_URL || "redis://localhost:6379" });
    client.on("error", (error) => {
      console.error(error);
    });

    client.on("connect", () => {
      console.error("Redis connected");
    });

    await client.connect();
  }

  return client;
}
