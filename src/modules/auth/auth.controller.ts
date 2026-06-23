import { env } from "../../config/env.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { UnauthorizedError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  clearRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
} from "./auth.cookie.js";
import { IAuthService } from "./auth.service.js";

export class AuthController {
  readonly authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  register = asyncHandler(async (req, res) => {
    const tokens = await this.authService.register(req.body);
    setRefreshCookie(res, tokens.refreshToken);

    ApiResponse.create(res, {
      accessToken: tokens.accessToken,
      ...(env.NODE_ENV !== "production" && {
        refreshToken: tokens.refreshToken,
      }),
    });
  });

  login = asyncHandler(async (req, res) => {
    const tokens = await this.authService.login(req.body);
    setRefreshCookie(res, tokens.refreshToken);

    ApiResponse.success(res, {
      accessToken: tokens.accessToken,
      ...(env.NODE_ENV !== "production" && {
        refreshToken: tokens.refreshToken,
      }),
    });
  });

  logout = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedError("No refresh token");
    }
    const accessToken = req.headers.authorization!.split(" ")[1];

    await this.authService.logout(refreshToken, accessToken!);
    clearRefreshCookie(res);

    ApiResponse.noContent(res);
  });

  logoutAll = asyncHandler(async (req, res) => {
    const accessToken = req.headers.authorization!.split(" ")[1];

    await this.authService.logoutAll(req.user!.id, accessToken!);
    clearRefreshCookie(res);

    ApiResponse.noContent(res);
  });

  refresh = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedError("No refresh token");
    }

    const data = await this.authService.refresh(refreshToken);

    ApiResponse.success(res, data);
  });
}
