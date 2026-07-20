import { Router } from "express";
import {
  getPublicStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentProfile.controller.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const studentRoles = authorizeRoles("student");

// Student profile routes expose private settings and public portfolio data.
router.route("/public-profile/:studentId").get(getPublicStudentProfile);

router
  .route("/profile")
  .get(verifyJWT, studentRoles, getStudentProfile)
  .put(verifyJWT, studentRoles, updateStudentProfile);

export default router;
