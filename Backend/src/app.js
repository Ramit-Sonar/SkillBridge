import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.routes.js";
import jobRouter from "./routes/job.routes.js";
import studentRouter from "./routes/student.routes.js";
import clientRouter from "./routes/client.routes.js";
import verificationRouter from "./routes/verification.routes.js";
import applicationRouter from "./routes/application.routes.js";
import projectRouter from "./routes/project.routes.js";
import reviewRouter from "./routes/review.routes.js";
import reportRouter from "./routes/report.routes.js";

/**
 * Configures shared Express middleware and mounts all API route groups.
 */
const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://localhost:5174"];

const allowedOrigins = [...new Set([...configuredOrigins, ...devOrigins])];

// Allow configured frontend origins while still supporting local Vite ports.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/client", clientRouter);
app.use("/api/v1/verification", verificationRouter);
app.use("/api/v1/applications", applicationRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/reports", reportRouter);

app.use(globalErrorHandler);

export { app };
