import type { Response } from "express";
import { PaginationResponseDto } from "../types/pagination.js";

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static create<T>(res: Response, data: T) {
    return this.success(res, data, 201);
  }

  static noContent(res: Response, statusCode = 204) {
    return res.status(statusCode).json({
      success: true,
      message: "Action don successfully",
    });
  }

  static paginationData<T>(
    res: Response,
    paginationData: PaginationResponseDto<T>,
    statusCode: number = 200,
  ) {
    return res.status(statusCode).json({
      success: true,
      data: paginationData.data,
      metaData: paginationData.metaData,
    });
  }
}
