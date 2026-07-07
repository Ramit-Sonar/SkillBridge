import { Router } from "express";
import {
  getMyProjects,
  getProjectById,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const projectRoles = authorizeRoles("student", "client");

router.route("/my-projects").get(verifyJWT, projectRoles, getMyProjects);
router.route("/:projectId").get(verifyJWT, projectRoles, getProjectById);

export default router;
