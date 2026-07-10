import { Router } from "express";
import {
  createReview,
  getStudentRatingSummary,
  getStudentReviews,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const clientRoles = authorizeRoles("client");
const studentRoles = authorizeRoles("student");

router
  .route("/my-rating-summary")
  .get(verifyJWT, studentRoles, getStudentRatingSummary);
router.route("/my-reviews").get(verifyJWT, studentRoles, getStudentReviews);
router.route("/projects/:projectId").post(verifyJWT, clientRoles, createReview);

export default router;
