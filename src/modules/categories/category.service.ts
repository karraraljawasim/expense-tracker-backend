import { Types } from "mongoose";
import { PaginationResponseDto } from "../../types/pagination.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  GoneError,
} from "../../utils/AppError.js";
import { Users } from "../users/user.model.js";
import { Categories } from "./category.model.js";
import { Category } from "./category.types.js";
import {
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from "./category.validation.js";

export interface ICategoryService {
  create: (
    input: CreateCategoryRequestDto & { userId: string },
  ) => Promise<Category>;

  getAll: (
    userId: string,
    query: { pageSize: string; page: string },
  ) => Promise<PaginationResponseDto<Category>>;
  getOneById: (categoryId: string, userId: string) => Promise<Category>;
  updateById: (
    input: UpdateCategoryRequestDto,
    categoryId: string,
    userId: string,
  ) => Promise<Category>;

  deleteById: (categoryId: string, userId: string) => Promise<void>;
}

export class CategoryService implements ICategoryService {
  async create(input: CreateCategoryRequestDto & { userId: string }) {
    const category = await Categories.findOne({
      name: input.name,
      userId: input.userId,
    });
    if (category) {
      throw new ConflictError("Category with same name");
    }

    if (!input.currency && input.userId) {
      const user = await Users.findById(input.userId);
      if (user && user.currency) {
        input.currency = user.currency;
      }
    }

    const newCategory = await Categories.create({ ...input });
    if (!newCategory) {
      throw new AppError("Create new category failed");
    }

    return newCategory;
  }

  async getAll(userId: string, query: { pageSize: string; page: string }) {
    const page = parseInt(query.page, 10) || 1;
    const pageSize = parseInt(query.pageSize, 10) || 10;

    const categories = await Categories.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      {
        $facet: {
          metaData: [{ $count: "totalCount" }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ]);

    const totalCount = categories[0]?.metaData[0]?.totalCount || 0;
    return {
      data: categories[0].data,
      metaData: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.round(totalCount / pageSize),
      },
    };
  }

  async getOneById(categoryId: string, userId: string) {
    const category = await Categories.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category");
    }
    if (category.isDeleted) {
      throw new GoneError("category");
    }

    if (!category.userId.equals(userId)) {
      throw new UnauthorizedError("You not owner to this category");
    }

    return category;
  }

  async updateById(
    input: UpdateCategoryRequestDto,
    categoryId: string,
    userId: string,
  ) {
    const category = await Categories.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category");
    }

    if (!category.userId.equals(userId)) {
      throw new UnauthorizedError("You not owner to this category");
    }

    if (category.isDeleted) {
      throw new GoneError("category");
    }

    await Categories.updateOne(
      { _id: categoryId },
      { ...input },
      { timestamps: true },
    );

    const updatedCategory = await Categories.findById(categoryId);

    return updatedCategory!;
  }

  async deleteById(categoryId: string, userId: string) {
    const category = await Categories.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category");
    }
    if (category.isDeleted) {
      throw new GoneError("category");
    }

    if (!category.userId.equals(userId)) {
      throw new UnauthorizedError("You not owner to this category");
    }

    const deletedCategory = await Categories.findByIdAndUpdate(categoryId, {
      isDeleted: true,
    });
    if (!deletedCategory) {
      throw new AppError("Delete category failed");
    }
  }
}
