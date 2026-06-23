import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { startCronJobs } from "./config/cron.js";
import { initializeRedisClient } from "./config/redis/redis.client.js";

export async function bootstrap() {
  try {
    // Connect to database
    if (env.NODE_ENV !== "test") {
      await connectDB();
    }
    startCronJobs();
    await initializeRedisClient();

    app.listen(env.PORT, () => {
      console.log(`Server run on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server:`, error);
    process.exit(1);
  }
}

bootstrap();
