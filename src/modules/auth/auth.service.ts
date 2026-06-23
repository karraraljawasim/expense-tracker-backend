import bcrypt from "bcrypt";
import { RefreshToken } from "./auth.model.js";
import {
  LoginUserRequestDto,
  RegisterUserRequestDto,
} from "./auth.validation.js";
import { Users } from "../users/user.model.js";
import { ConflictError, UnauthorizedError } from "../../utils/AppError.js";
import { jwtUtils } from "../../utils/jwt.js";
import { TokenPair } from "./auth.types.js";
import { blacklistToken, hashToken } from "./auth.cache.js";

const EXPIRES_REFRESH_TOKEN = 1000 * 60 * 60 * 24 * 7;
export interface IAuthService {
  register: (input: RegisterUserRequestDto) => Promise<TokenPair>;
  login: (input: LoginUserRequestDto) => Promise<TokenPair>;
  logout: (refreshToken: string, accessToken: string) => Promise<void>;
  logoutAll: (usrId: string, accessToken: string) => Promise<void>;
  refresh: (refreshToken: string) => Promise<Pick<TokenPair, "accessToken">>;
}

export class AuthService implements IAuthService {
  async register(input: RegisterUserRequestDto) {
    const userExist = await Users.findOne({ email: input.email });
    if (userExist) {
      throw new ConflictError("User");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const newUser = await Users.create({
      ...input,
      passwordHash: passwordHash,
    });

    const tokenPair = jwtUtils.signPair({
      sub: {
        id: newUser.id,
        role: newUser.role,
      },
    });

    const hashedToken = hashToken(tokenPair.refreshToken);

    await RefreshToken.create({
      userId: newUser.id,
      hashedToken: hashedToken,
      expiresAt: new Date(Date.now() + EXPIRES_REFRESH_TOKEN),
    });

    return tokenPair;
  }

  async login(input: LoginUserRequestDto) {
    const user = await Users.findOne({ email: input.email });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const validPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = jwtUtils.signPair({ sub: { id: user.id, role: user.role } });
    const hashedToken = hashToken(tokens.refreshToken);

    await RefreshToken.create({
      userId: user._id,
      hashedToken: hashedToken,
      expiresAt: new Date(Date.now() + EXPIRES_REFRESH_TOKEN),
    });

    return tokens;
  }

  async logout(refreshToken: string, accessToken: string) {
    let decoded: { exp: number };
    try {
      decoded = jwtUtils.verifyAccessToken(accessToken) as unknown as {
        exp: number;
      };
    } catch (error) {
      throw new UnauthorizedError("Invalid token");
    }

    const nowInSecond = Math.floor(Date.now() / 1000);
    const remainingTtl = decoded.exp - nowInSecond;

    if (remainingTtl <= 0) return;

    const hashedToken = hashToken(refreshToken);

    remainingTtl > 0
      ? await Promise.all([
          blacklistToken(accessToken, remainingTtl),
          RefreshToken.updateOne(
            { hashedToken: hashedToken },
            { isRevoked: true },
          ),
        ])
      : await RefreshToken.updateMany(
          { hashedToken: hashedToken },
          { isRevoked: true },
        );
  }

  async logoutAll(userId: string, accessToken: string) {
    let decoded: { exp: number };
    try {
      decoded = jwtUtils.verifyAccessToken(accessToken) as unknown as {
        exp: number;
      };
    } catch (error) {
      throw new UnauthorizedError("Invalid token");
    }

    const nowInSecond = Math.floor(Date.now() / 1000);
    const remainingTtl = decoded.exp - nowInSecond;

    remainingTtl > 0
      ? await Promise.all([
          blacklistToken(accessToken, remainingTtl),
          RefreshToken.updateMany({ userId: userId }, { isRevoked: true }),
        ])
      : await RefreshToken.updateMany({ userId: userId }, { isRevoked: true });
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = jwtUtils.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const hashedToken = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({
      hashedToken: hashedToken,
      expiresAt: { $gt: new Date() },
      isRevoked: false,
    });

    if (!storedToken) {
      throw new UnauthorizedError("Refresh token revoked");
    }

    if (!storedToken.userId.equals(payload.sub.id)) {
      await RefreshToken.updateOne(
        { hashedToken: hashedToken },
        { isRevoked: true },
      );
      throw new UnauthorizedError("Mismatch refresh token");
    }
    const accessToken = jwtUtils.signAccessToken(payload);

    return {
      accessToken,
    };
  }
}
