import express from "express";
import { TaskController } from "./task.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { TaskValidation } from "./task.validation";

const router = express.Router();

router.post(
  "/",
  auth(Role.SOLVER),
  validateRequest(TaskValidation.createTaskValidationSchema),
  TaskController.createTask,
);

router.post(
  "/submit",
  auth(Role.SOLVER),
  validateRequest(TaskValidation.submitTaskValidationSchema),
  TaskController.submitTask,
);

router.post(
  "/review",
  auth(Role.BUYER),
  validateRequest(TaskValidation.reviewTaskValidationSchema),
  TaskController.reviewTask,
);

export const TaskRoutes = router;
