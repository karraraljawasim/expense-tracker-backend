import {
  paginationQuery,
  PaginationResponseDto,
} from "../../types/pagination.js";
import { ForbiddenError, NotFoundError } from "../../utils/AppError.js";
import { Users } from "./user.model.js";
import { IUser, UserRole } from "./user.types.js";
import { UpdateUserRequestDto } from "./user.validation.js";

export interface IUserService {
  getById: (userId: string, role: UserRole) => Promise<IUser>;
  getAll: (
    role: UserRole,
    query: paginationQuery,
  ) => Promise<PaginationResponseDto<IUser>>;
  softDeleteById: (userId: string, role: UserRole) => Promise<IUser>;
  updateById: (
    userId: string,
    role: UserRole,
    input: UpdateUserRequestDto,
  ) => Promise<IUser>;
}

export class UserService implements IUserService {
  async getById(userId: string, role: UserRole) {
    if (role !== "admin") {
      throw new ForbiddenError();
    }

    const user = await Users.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }

  async getAll(role: UserRole, query: paginationQuery) {
    if (role !== "admin") {
      throw new ForbiddenError();
    }
    const pageSize = parseInt(query.pageSize) || 10;
    const page = parseInt(query.page) || 1;

    const users = await Users.aggregate([
      {
        $match: {
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

    const totalCount = users[0]?.metaData[0]?.totalCount || 0;
    return {
      data: users[0].data,
      metaData: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.round(totalCount / pageSize),
      },
    };
  }

  async softDeleteById(userId: string, role: UserRole) {
    if (role !== "admin") {
      throw new ForbiddenError();
    }

    await Users.updateOne(
      { _id: userId, isDeleted: false },
      {
        isDeleted: true,
      },
    );

    const updatedUser = await Users.findById(userId);

    if (!updatedUser) {
      throw new NotFoundError("User");
    }

    return updatedUser;
  }

  async updateById(
    userId: string,
    role: UserRole,
    input: UpdateUserRequestDto,
  ) {
    if (role !== "admin") {
      throw new ForbiddenError();
    }

    await Users.findByIdAndUpdate(userId, {
      ...input,
    }).exec();

    const updatedUser = await Users.findById(userId);

    if (!updatedUser) {
      throw new NotFoundError("User");
    }
    return updatedUser;
  }
}
