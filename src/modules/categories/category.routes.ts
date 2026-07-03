import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { CategoryService } from "./category.service.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  categoryIdParamsSchema,
  createCategorySchema,
  paginateQuery,
  updateCategorySchema,
} from "./category.validation.js";

const categoryController = new CategoryController(new CategoryService());

export const categoryRouter = Router();

categoryRouter
  .route("/")
  .post(validate(createCategorySchema), categoryController.create)
  .get(validate(paginateQuery, "query"), categoryController.getAll);

categoryRouter
  .route("/:categoryId")
  .get(
    validate(categoryIdParamsSchema, "params"),
    categoryController.getOneById,
  )
  .patch(
    validate(updateCategorySchema),
    validate(categoryIdParamsSchema, "params"),
    categoryController.updateById,
  )
  .put(
    validate(categoryIdParamsSchema, "params"),
    categoryController.deleteById,
  );
