import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes.js";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware.js";
import { categoryRouter } from "./modules/categories/category.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);

app.use(globalErrorHandler);

export default app;
