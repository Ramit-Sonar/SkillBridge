import { Router } from "express";
import {
  createMessage,
  getMessagesByProject,
  markMessageRead,
} from "../controllers/message.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const projectMessageRoles = authorizeRoles("student", "client");

router
  .route("/projects/:projectId/messages")
  .get(verifyJWT, projectMessageRoles, getMessagesByProject)
  .post(verifyJWT, projectMessageRoles, ensureActiveAccount, createMessage);

router
  .route("/messages/:messageId/read")
  .patch(verifyJWT, projectMessageRoles, ensureActiveAccount, markMessageRead);

export default router;
