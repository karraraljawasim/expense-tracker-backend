const REDIS_KEY = {
  auth: {
    blacklist: (tokenHash: string) =>
      `expense-tracker:auth:blacklist:${tokenHash}`,
  },

  rateLimiter: (userId?: string, ip?: string) =>
    `expense-tracker: rateLimiter: ${userId || ip || "unknown"}`,
} as const;

export default REDIS_KEY;
