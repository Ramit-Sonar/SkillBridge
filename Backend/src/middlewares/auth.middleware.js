import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    //Extract Token
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token || typeof token !== "string") {
      throw new ApiError(401, "Invalid token format");
    }

    // Verify JWT Token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //Find User From Database
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    //Attach user to req.user
    req.user = user; //You are attaching authenticated user information into request object.
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired token");
  }
});

export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token || typeof token !== "string") {
    next();
    return;
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Public routes should still work when no valid session is present.
  }

  next();
});
