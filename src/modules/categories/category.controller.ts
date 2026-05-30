import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ICategoryService } from "./category.service.js";

export class CategoryController {
  readonly #categoryService: ICategoryService;

  constructor(categoryService: ICategoryService) {
    this.#categoryService = categoryService;
  }

  create = asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await this.#categoryService.create({ ...req.body, userId });

    ApiResponse.create(res, { message: "Create new category successfully" });
  });
}
