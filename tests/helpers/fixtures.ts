import bcrypt from "bcrypt";
import { Users } from "../../src/modules/users/user.model.js";
import { jwtUtils } from "../../src/utils/jwt.js";
import Categories from "../../src/modules/categories/category.model.js";
import { Types } from "mongoose";

export function getAuthTokens(user: any) {
  return jwtUtils.signPair({ sub: { id: user._id, role: user.role } });
}
export async function createTestUser(overrides = {}) {
  return await Users.create({
    name: "testUser",
    email: "test@example.com",
    passwordHash: await bcrypt.hash("password123", 10),
    currency: "USD",
    role: "user",
    isDeleted: false,
    ...overrides,
  });
}

export async function createAuthenticedUser(overrides = {}) {
  const user = await createTestUser(overrides);
  const tokens = getAuthTokens(user);

  return { user, tokens };
}

export async function createTestCategory(
  userId: Types.ObjectId,
  overrides = {},
) {
  return await Categories.create({
    userId,
    name: "test cateogry",
    budgetLimit: 100,
    currency: "USD",
    color: "#6B7280",
    ...overrides,
  });
}
