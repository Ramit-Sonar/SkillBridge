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
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("mongodb connection ERROR: ", error);
    process.exit(1);
  }
};

export default connectDB;
