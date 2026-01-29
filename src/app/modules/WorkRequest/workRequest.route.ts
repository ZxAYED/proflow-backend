import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { WorkRequestController } from "./workRequest.controller";
import { WorkRequestValidation } from "./workRequest.validation";

const router = express.Router();

router.post(
  "/",
  auth(Role.SOLVER),
  validateRequest(WorkRequestValidation.createWorkRequestValidationSchema),
  WorkRequestController.createWorkRequest
);

router.get(
  "/",
  auth(Role.BUYER, Role.SOLVER),
  WorkRequestController.getWorkRequests
);

router.post(
  "/accept",
  auth(Role.BUYER),
  validateRequest(WorkRequestValidation.acceptWorkRequestValidationSchema),
  WorkRequestController.acceptWorkRequest
);

export const WorkRequestRoutes = router;
