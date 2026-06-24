import { initializeRedisClient } from "../../config/redis/redis.client.js";
import REDIS_KEY from "../../config/redis/redis.keys.js";
import { CachedCategories, Category } from "./category.types.js";

const client = await initializeRedisClient();

export async function setCacheCategories(
  userId: string,
  data: Category[],
  page: number,
  pageSize: number,
) {
  const key = REDIS_KEY.categories(userId);

  await client.hSet(key, {
    categories: JSON.stringify(data),
    page: JSON.stringify(page),
    pageSize: JSON.stringify(pageSize),
  });
}

export async function getCachedCategories(
  userId: string,
): Promise<CachedCategories | null> {
  const key = REDIS_KEY.categories(userId);
  const data = await client.hGetAll(key);

  if ((Object.keys(data).length === 0, !data.categories)) return null;
  return {
    categories: JSON.parse(data.categories),
    page: parseInt(data.page!),
    pageSize: parseInt(data.pageSize!),
  };
}

export async function clearCachedCategories(userId: string) {
  const key = REDIS_KEY.categories(userId);

  await client.del(key);
}
