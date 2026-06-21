import { vi, describe, beforeEach, it, expect } from "vitest";
import bcrypt from "bcrypt";
import { getAuthTokens } from "../../../tests/helpers/fixtures.js";

vi.mock("./auth.model", () => ({
  RefreshToken: {
    create: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock("../users/user.model", () => ({
  Users: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

import { Users } from "../users/user.model.js";
import { AuthService } from "./auth.service.js";
import { Types } from "mongoose";
import { RefreshToken } from "./auth.model.js";

const authService = new AuthService();

describe("AuthService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Should hashing password before saving", async () => {
    Users.findOne = vi.fn().mockResolvedValue(null);
    Users.create = vi.fn().mockResolvedValue({
      _id: "userId123",
      email: "test@example.com",
      role: "user",
    });

    await authService.register({
      name: "test",
      email: "test@example.com",
      password: "password123",
      currency: "USD",
      role: "user",
    });

    const callArg = (Users.create as any).mock.calls[0][0];
    expect(callArg?.passwordHash).not.toBe("password123");

    const isHashed = await bcrypt.compare("password123", callArg?.passwordHash);
    expect(isHashed).toBe(true);
  });

  it("Should throwing conflict error if email already exist", async () => {
    Users.findOne = vi.fn().mockResolvedValue("test@example.com");

    await expect(
      authService.register({
        name: "test",
        email: "test@example.com",
        password: "password123",
        currency: "USD",
        role: "user",
      }),
    ).rejects.toThrow();

    expect(Users.create).not.toHaveBeenCalled();
  });

  it("Should return access token and refersh token on successful", async () => {
    Users.findOne = vi.fn().mockResolvedValue(null);
    Users.create = vi.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      role: "user",
    });

    RefreshToken.create = vi.fn().mockResolvedValue({});

    const result = await authService.register({
      name: "test",
      email: "test@example.com",
      password: "password123",
      currency: "USD",
      role: "user",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");

    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");
  });
});

describe("AuthSerice.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should throw error if user not found", async () => {
    Users.findOne = vi.fn().mockResolvedValue(null);

    await expect(
      authService.login({
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toThrow();
  });

  it("Should throw error if password is wrong", async () => {
    Users.findOne = vi.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      email: "test@example.com",
      passwordHash: await bcrypt.hash("corrict password", 10),
      role: "user",
    });

    await expect(
      authService.login({
        email: "test@example.com",
        password: "wrong password",
      }),
    ).rejects.toThrow();
  });

  it("Should return tokens if email and password correct", async () => {
    const passwordHash = await bcrypt.hash("coorectPassword", 10);
    Users.findOne = vi.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      email: "test@example.com",
      passwordHash,
      role: "user",
    });
    RefreshToken.create = vi.fn().mockResolvedValue({});

    const result = await authService.login({
      email: "test@example.com",
      password: "coorectPassword",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });

  it("Sholud return the same error message for wrong password and email", async () => {
    Users.findOne = vi.fn().mockResolvedValue(null);

    let messageForWrongEmail: any;

    try {
      await authService.login({
        email: "wrongEmail@example.com",
        password: "correctPassword",
      });
    } catch (error) {
      messageForWrongEmail = error;
    }

    Users.findOne = vi.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      email: "test@example.com",
      passwordHash: await bcrypt.hash("correctPassword", 10),
      role: "user",
    });

    let messageForWrongPassword: any;

    try {
      await authService.login({
        email: "test@example.com",
        password: "wrongPassword",
      });
    } catch (error) {
      messageForWrongPassword = error;
    }

    expect(messageForWrongEmail.message).toBe(messageForWrongPassword.message);
  });
});

describe("AuthService.refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Return a access token on valid refresh token", async () => {
    const userId = new Types.ObjectId();

    Users.findById = vi.fn().mockResolvedValue({
      _id: userId,
      role: "user",
    });

    const tokens = getAuthTokens({ _id: userId, role: "user" });

    RefreshToken.findOne = vi.fn().mockResolvedValue({
      _id: "tokenId",
      userId: userId,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const result = await authService.refresh(tokens.refreshToken);

    expect(result).toHaveProperty("accessToken");
  });

  it("Throw error if token is not found", async () => {
    RefreshToken.findOne = vi.fn().mockResolvedValue(null);

    await expect(authService.refresh("notFuondToken")).rejects.toThrow();
  });

  it("Throw error if token is stolen", async () => {
    const atherUserId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    const tokens = getAuthTokens({ _id: userId, role: "user" });

    RefreshToken.findOne = vi.fn().mockResolvedValue({
      _id: "tokenId",
      userId: atherUserId,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    RefreshToken.deleteOne = vi.fn().mockResolvedValue({});

    await expect(authService.refresh(tokens.refreshToken)).rejects.toThrow();
    expect(RefreshToken.deleteOne).toHaveBeenCalledTimes(1);
  });
});

describe("Auth.logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delete refresh token on logout", async () => {
    RefreshToken.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });

    await authService.logout("sameRefreshToken");

    expect(RefreshToken.deleteOne).toHaveBeenCalledTimes(1);
  });

  it("does not throw error if token not found", async () => {
    RefreshToken.deleteOne = vi.fn().mockResolvedValue({ deleledCount: 0 });

    await expect(authService.logout("notExistToken")).resolves.not.toThrow();
  });
});
