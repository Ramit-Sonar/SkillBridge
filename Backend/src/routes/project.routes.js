import { Router } from "express";
import {
  getMyProjects,
  getProjectById,
  getProjectDeliverables,
  submitDeliverable,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const projectRoles = authorizeRoles("student", "client");
const studentRoles = authorizeRoles("student");
const deliverableAttachmentUpload = (req, res, next) => {
  jobAttachmentUpload.array("attachments", 3)(req, res, (error) => {
    if (error) {
      removeTempFiles(req.files);
      next(error);
      return;
    }

    next();
  });
};

router.route("/my-projects").get(verifyJWT, projectRoles, getMyProjects);
router
  .route("/:projectId/deliverables")
  .get(verifyJWT, projectRoles, getProjectDeliverables)
  .post(
    verifyJWT,
    studentRoles,
    deliverableAttachmentUpload,
    submitDeliverable
  );
router.route("/:projectId").get(verifyJWT, projectRoles, getProjectById);

export default router;
