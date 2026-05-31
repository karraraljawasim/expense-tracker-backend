import { JwtPayload } from "../modules/auth/auth.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "admin" | "user";
      };
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      validateQuery: unknown;
    }
  }
}
