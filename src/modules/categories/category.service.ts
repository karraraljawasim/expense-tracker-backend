import { AppError, ConflictError } from "../../utils/AppError.js";
import User from "../users/user.model.js";
import Categories from "./category.model.js";
import { CreateCategoryRequestDto } from "./category.validation.js";

export interface ICategoryService {
  create: (
    input: CreateCategoryRequestDto & { userId: string },
  ) => Promise<void>;
}

export class CategoryService implements ICategoryService {
  async create(input: CreateCategoryRequestDto & { userId: string }) {
    const categoryExist = await Categories.findOne({ name: input.name });
    if (categoryExist) {
      throw new ConflictError("Category with same name");
    }

    if (!input.currency && input.userId) {
      const user = await User.findById(input.userId);
      if (user && user.currency) {
        input.currency = user.currency;
      }
    }

    const newCategory = await Categories.create({ ...input });
    if (!newCategory) {
      throw new AppError("Create new category failed");
    }
  }
}
