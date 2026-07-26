import { Router } from "express";
import {
  getClientProfile,
  updateClientProfile,
} from "../controllers/clientProfile.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const clientRoles = authorizeRoles("client");

// Client profile routes are private to the authenticated client account.
router
  .route("/profile")
  .get(verifyJWT, clientRoles, getClientProfile)
  .put(verifyJWT, clientRoles, ensureActiveAccount, updateClientProfile);

export default router;
