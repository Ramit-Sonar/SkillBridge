import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import connectDB from "./db/index.js";
import { app } from "./app.js";
import createAdmin from "./services/admin.service.js";
import { validateEnv } from "./utils/validateEnv.js";

const port = process.env.PORT || 3000;

validateEnv();

connectDB()
  .then(async () => {
    // Seed the default admin after MongoDB is ready.
    await createAdmin();

    app.on("error", (error) => {
      console.log("EXPRESS SERVER ERROR:", error);
    });

    app.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection failed !!!", err);
  });
