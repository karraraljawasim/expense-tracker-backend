import { Types } from "mongoose";
export type JwtPayload = {
  sub: { id: string; role: "admin" | "user" };
  type: "refresh" | "access";
};

export type TokenPair = {
  refreshToken: string;
  accessToken: string;
};

export type IRefreshToken = {
  userId: Types.ObjectId;
  hashedToken: string;
  expiresAt: Date;
  isRevoked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
