import { Role } from "@prisma/client";
import express from "express";
import upload from "../../../helpers/upload";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { TaskSubItemController } from "./task.subitem.controller";
import { TaskSubItemValidation } from "./task.subitem.validation";
import { TaskValidation } from "./task.validation";

const router = express.Router();

router.post(
  "/",
  auth(Role.SOLVER),
  validateRequest(TaskValidation.createTaskValidationSchema),
  TaskController.createTask,
);

// Submissions
router.post(
  "/:taskId/submissions",
  auth(Role.SOLVER),
  upload.single("file"),
  (req, res, next) => {
    if (req.body.data) {
       req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(TaskValidation.submitTaskValidationSchema),
  TaskController.submitTask,
);

router.get(
    "/:taskId/submissions/latest",
    auth(Role.BUYER, Role.SOLVER, Role.ADMIN),
    TaskController.getLatestSubmission
);

// Buyer Review
router.patch(
  "/:taskId/review",
  auth(Role.BUYER),
  validateRequest(TaskValidation.reviewTaskValidationSchema),
  TaskController.reviewTask,
);

// Subtasks (Items)
router.post(
    "/:taskId/items",
    auth(Role.SOLVER),
    validateRequest(TaskSubItemValidation.createSubItemValidationSchema),
  TaskSubItemController.createSubItem
);

router.get(
    "/:taskId/items",
    auth(Role.SOLVER, Role.BUYER, Role.ADMIN), // Allow Buyer/Admin to view progress
    TaskSubItemController.getSubItems
);

export const TaskRoutes = router;
