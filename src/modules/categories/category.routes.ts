import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { CategoryService } from "./category.service.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { createCategorySchema } from "./category.validation.js";

const categoryController = new CategoryController(new CategoryService());

export const categoryRouter = Router();

categoryRouter
  .route("/")
  .post(
    authenticate,
    validate(createCategorySchema),
    categoryController.create,
  );
