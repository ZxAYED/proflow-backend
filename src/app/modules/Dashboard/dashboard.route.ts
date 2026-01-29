import { Role } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { DashboardController } from "./dashboard.controller";

const router = express.Router();

router.get(
  "/stats",
  auth(Role.BUYER, Role.SOLVER, Role.ADMIN),
  DashboardController.getDashboardStats
);

export const DashboardRoutes = router;
