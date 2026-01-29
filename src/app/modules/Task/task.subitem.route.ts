import { Role } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskSubItemController } from "./task.subitem.controller";
import { TaskSubItemValidation } from "./task.subitem.validation";

const router = express.Router();

router.patch(
  "/:id",
  auth(Role.SOLVER),
  validateRequest(TaskSubItemValidation.updateSubItemValidationSchema),
  TaskSubItemController.updateSubItem
);

router.delete(
  "/:id",
  auth(Role.SOLVER),
  TaskSubItemController.deleteSubItem
);

export const TaskSubItemRoutes = router;
