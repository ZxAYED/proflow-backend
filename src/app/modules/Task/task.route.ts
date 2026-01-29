import { Role } from "@prisma/client";
import express from "express";
import upload from "../../../helpers/upload";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
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


router.post(
  "/review",
  auth(Role.BUYER),
  validateRequest(TaskValidation.reviewTaskValidationSchema),
  TaskController.reviewTask,
);

export const TaskRoutes = router;
