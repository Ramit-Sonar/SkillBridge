import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import http from "http";
import connectDB from "./db/index.js";
import { allowedOrigins, app } from "./app.js";
import createAdmin from "./services/admin.service.js";
import { initializeSocketServer } from "./socket/projectMessage.socket.js";
import { validateEnv } from "./utils/validateEnv.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

validateEnv();
initializeSocketServer(server, allowedOrigins);

connectDB()
  .then(async () => {
    // Seed the default admin after MongoDB is ready.
    await createAdmin();

    app.on("error", (error) => {
      console.log("EXPRESS SERVER ERROR:", error);
    });

    server.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection failed !!!", err);
  });
