const REQUIRED_ENV = [
  "MONGODB_URI",
  "CORS_ORIGIN",
  "ACCESS_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "FRONTEND_URL",
];

const isProduction = process.env.NODE_ENV === "production";

const validateUrlList = (name, value) => {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      try {
        const url = new URL(item);
        return url.protocol !== "http:" && url.protocol !== "https:";
      } catch {
        return true;
      }
    });
};

export const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  const invalid = [
    ...validateUrlList("CORS_ORIGIN", process.env.CORS_ORIGIN),
    ...validateUrlList("FRONTEND_URL", process.env.FRONTEND_URL),
  ];

  if (process.env.CORS_ORIGIN?.includes("*")) {
    invalid.push("CORS_ORIGIN cannot contain wildcard origins");
  }

  if (isProduction) {
    if ((process.env.ACCESS_TOKEN_SECRET || "").length < 32) {
      invalid.push("ACCESS_TOKEN_SECRET must be at least 32 characters");
    }

    if ((process.env.REFRESH_TOKEN_SECRET || "").length < 32) {
      invalid.push("REFRESH_TOKEN_SECRET must be at least 32 characters");
    }
  }

  if (missing.length || invalid.length) {
    const message = [
      missing.length ? `Missing env: ${missing.join(", ")}` : "",
      invalid.length ? `Invalid env: ${invalid.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(". ");

    if (isProduction) {
      throw new Error(message);
    }

    console.warn(`Environment warning: ${message}`);
  }
};
