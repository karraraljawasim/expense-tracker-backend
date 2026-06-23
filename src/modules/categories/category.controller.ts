import { z } from "zod";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ICategoryService } from "./category.service.js";
import { paginateQuery } from "./category.validation.js";

export class CategoryController {
  readonly #categoryService: ICategoryService;

  constructor(categoryService: ICategoryService) {
    this.#categoryService = categoryService;
  }

  create = asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const data = await this.#categoryService.create({ ...req.body, userId });

    ApiResponse.create(res, data);
  });

  getAll = asyncHandler(async (req, res) => {
    const query = req.validateQuery as z.infer<typeof paginateQuery>;
    const data = await this.#categoryService.getAll(req.user!.id, query);

    ApiResponse.paginationData(res, data);
  });

  getOneById = asyncHandler(async (req, res) => {
    const data = await this.#categoryService.getOneById(
      req.params.categoryId as string,
      req.user!.id,
    );

    ApiResponse.success(res, data);
  });

  updateById = asyncHandler(async (req, res) => {
    const data = await this.#categoryService.updateById(
      req.body,
      req.params.categoryId as string,
      req.user!.id,
    );

    ApiResponse.success(res, data);
  });

  deleteById = asyncHandler(async (req, res) => {
    await this.#categoryService.deleteById(
      req.params.categoryId as string,
      req.user!.id,
    );

    ApiResponse.success(res, { message: "Delete category successfully" });
  });
}
