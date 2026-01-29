import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { RealtimeController } from "./realtime.controller";

const router = express.Router();

router.get(
  "/events",
  auth(Role.BUYER, Role.SOLVER, Role.ADMIN),
  RealtimeController.subscribe
);

export const RealtimeRoutes = router;
