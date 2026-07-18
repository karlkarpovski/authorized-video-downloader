import rateLimit from "express-rate-limit";

export const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analyze requests. Wait a moment and try again." },
});

export const createJobLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many download requests. Wait a moment and try again." },
});