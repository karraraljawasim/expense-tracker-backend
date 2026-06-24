import { Types } from "mongoose";

export type Category = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  color?: string;
  currency: string;
  budgetLimit?: number;
  isDeleted: boolean;
  createAt?: Date;
  updateAt?: Date;
};

export type CachedCategories = {
  categories: any;
  page: number;
  pageSize: number;
};
