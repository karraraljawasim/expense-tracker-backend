import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { CategoryService } from "./category.service.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  categoryIdParamsSchema,
  createCategorySchema,
  paginateQury,
  updateCategorySchema,
} from "./category.validation.js";

const categoryController = new CategoryController(new CategoryService());

export const categoryRouter = Router();

categoryRouter
  .route("/")
  .post(authenticate, validate(createCategorySchema), categoryController.create)
  .get(
    authenticate,
    validate(paginateQury, "query"),
    categoryController.getAll,
  );

categoryRouter
  .route("/:categoryId")
  .get(
    authenticate,
    validate(categoryIdParamsSchema, "params"),
    categoryController.getOneById,
  )
  .patch(
    authenticate,
    validate(updateCategorySchema),
    validate(categoryIdParamsSchema, "params"),
    categoryController.updateById,
  )
  .delete(
    authenticate,
    validate(categoryIdParamsSchema, "params"),
    categoryController.deleteById,
  );
