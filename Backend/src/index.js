import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import http from "http";
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { allowedOrigins, app } from "./app.js";
import createAdmin from "./services/admin.service.js";
import { initializeSocketServer } from "./socket/projectMessage.socket.js";
import { validateEnv } from "./utils/validateEnv.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);
let socketServer;
let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully.`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async (error) => {
    if (error) {
      console.error("HTTP server shutdown failed.");
      process.exit(1);
    }

    try {
      if (socketServer) {
        socketServer.close();
      }

      await mongoose.connection.close(false);
      clearTimeout(forceExitTimer);
      console.log("Graceful shutdown completed.");
      process.exit(0);
    } catch (shutdownError) {
      console.error("Graceful shutdown failed.");
      process.exit(1);
    }
  });
};

validateEnv();
socketServer = initializeSocketServer(server, allowedOrigins);

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", () => shutdown("unhandledRejection"));
process.on("uncaughtException", () => shutdown("uncaughtException"));

connectDB()
  .then(async () => {
    // Seed the default admin after MongoDB is ready.
    await createAdmin();

    app.on("error", (error) => {
      if (process.env.NODE_ENV === "production") {
        console.error("Express server error.");
      } else {
        console.error("EXPRESS SERVER ERROR:", error);
      }
    });

    server.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Server startup failed.");
    } else {
      console.error("MONGO DB connection failed !!!", err);
    }
  });
