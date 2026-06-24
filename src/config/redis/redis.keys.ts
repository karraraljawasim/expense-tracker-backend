const REDIS_KEY = {
  auth: {
    blacklist: (tokenHash: string) =>
      `expense-tracker:auth:blacklist:${tokenHash}`,
  },

  rateLimiter: (userId?: string, ip?: string) =>
    `expense-tracker: rateLimiter: ${userId || ip || "unknown"}`,

  categories: (userId: string) => `expense-tracker: categories: ${userId}`,

  report: {
    summary: (userId: string) => `expense-tracker: report: summary: ${userId}`,
  },

  expenses: (userId: string) => `expense-tracker: expenses: ${userId}`,
} as const;

export default REDIS_KEY;
