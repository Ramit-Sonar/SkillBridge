import { Router } from "express";
import { createReview } from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const clientRoles = authorizeRoles("client");

router.route("/projects/:projectId").post(verifyJWT, clientRoles, createReview);

export default router;
