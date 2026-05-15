import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

export async function bootstrap() {
  try {
    // Connect to database
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`Server run on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server:`, error);
    process.exit(1);
  }
}

bootstrap();
