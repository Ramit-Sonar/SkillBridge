import helmet from "helmet";
import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";
const MINUTE_MS = 60 * 1000;
const LOGIN_WINDOW_MS = 15 * MINUTE_MS;
const REGISTER_WINDOW_MS = 60 * MINUTE_MS;
const OTP_WINDOW_MS = 10 * MINUTE_MS;
const PASSWORD_RESET_WINDOW_MS = 15 * MINUTE_MS;
const VERIFICATION_WINDOW_MS = 60 * MINUTE_MS;

const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      success: false,
      errorCode: "RATE_LIMIT_EXCEEDED",
      message,
      errors: [],
    },
  });

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    value.forEach(sanitizeObject);
    return value;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
      continue;
    }

    sanitizeObject(value[key]);
  }

  return value;
};

export const helmetMiddleware = helmet({
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
});

export const sanitizeNoSqlInput = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  next();
};

export const loginRateLimiter = createRateLimiter({
  windowMs: LOGIN_WINDOW_MS,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});

export const registerRateLimiter = createRateLimiter({
  windowMs: REGISTER_WINDOW_MS,
  max: 10,
  message: "Too many registration attempts. Please try again later.",
});

export const otpRateLimiter = createRateLimiter({
  windowMs: OTP_WINDOW_MS,
  max: 5,
  message: "Too many OTP attempts. Please try again later.",
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: PASSWORD_RESET_WINDOW_MS,
  max: 5,
  message: "Too many password reset attempts. Please try again later.",
});

export const verificationRateLimiter = createRateLimiter({
  windowMs: VERIFICATION_WINDOW_MS,
  max: 10,
  message: "Too many verification attempts. Please try again later.",
});
