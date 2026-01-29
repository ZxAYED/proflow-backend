import { Role } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { DashboardController } from "./dashboard.controller";

const router = express.Router();

router.get(
  "/buyer",
  auth(Role.BUYER),
  DashboardController.getDashboardStats
);

router.get(
  "/solver",
  auth(Role.SOLVER),
  DashboardController.getDashboardStats
);

router.get(
  "/admin",
  auth(Role.ADMIN),
  DashboardController.getDashboardStats
);

// Keep generic for flexibility if needed, or remove. 
// User prompt didn't ask for generic, but it doesn't hurt.
// However, to be strict with prompt "Auth: BUYER" for /buyer etc., specific routes are better.
// I will keep generic as fallback or legacy.
router.get(
  "/stats",
  auth(Role.BUYER, Role.SOLVER, Role.ADMIN),
  DashboardController.getDashboardStats
);

export const DashboardRoutes = router;
