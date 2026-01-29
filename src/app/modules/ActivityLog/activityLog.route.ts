import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { ActivityLogController } from "./activityLog.controller";

const router = express.Router();

router.get(
  "/",
  auth(Role.BUYER, Role.SOLVER, Role.ADMIN),
  ActivityLogController.getActivityLogs
);

export const ActivityLogRoutes = router;
