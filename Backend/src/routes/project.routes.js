import { Router } from "express";
import { getMyProjects } from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const projectRoles = authorizeRoles("student", "client");

router.route("/my-projects").get(verifyJWT, projectRoles, getMyProjects);

export default router;
