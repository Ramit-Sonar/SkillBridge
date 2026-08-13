import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/**
 * Opens the MongoDB connection used by the API server.
 */
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    if (process.env.NODE_ENV === "production") {
      console.log("MongoDB connected.");
      return;
    }

    console.log(
      `MongoDB connected. Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("Database connection failed.");
    } else {
      console.error("mongodb connection ERROR: ", error);
    }

    process.exit(1);
  }
};

export default connectDB;
