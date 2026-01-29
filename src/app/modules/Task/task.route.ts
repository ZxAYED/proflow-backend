import { Role } from "@prisma/client";
import express from "express";
import upload from "../../../helpers/upload";
import auth from "../../middlewares/auth";
import { fileUploadHandler } from "../../middlewares/fileUploadHandler";
import { parseMultipartJson } from "../../middlewares/parseMultipartJson";
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
  parseMultipartJson,
  fileUploadHandler("file", "file"), // Sets req.body.file to public URL
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
