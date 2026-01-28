import express from "express";
import { ProjectController } from "./project.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectValidation } from "./project.validation";

const router = express.Router();

router.post(
  "/",
  auth(Role.BUYER),
  validateRequest(ProjectValidation.createProjectValidationSchema),
  ProjectController.createProject,
);

router.get(
  "/",
  auth(Role.SOLVER, Role.BUYER, Role.ADMIN),
  ProjectController.getAllProjects,
);

router.post(
  "/request",
  auth(Role.SOLVER),
  validateRequest(ProjectValidation.projectRequestValidationSchema),
  ProjectController.requestProject,
);

router.get(
  "/requests",
  auth(Role.ADMIN),
  ProjectController.getProjectRequests,
);

router.post(
  "/assign",
  auth(Role.ADMIN),
  validateRequest(ProjectValidation.assignSolverValidationSchema),
  ProjectController.assignSolver,
);

export const ProjectRoutes = router;
