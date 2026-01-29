import { Role } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
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
  auth(Role.SOLVER, Role.BUYER, Role.ADMIN, Role.USER),
  ProjectController.getAllProjects,
);

router.post(
  "/request",
  auth(Role.SOLVER),
  validateRequest(ProjectValidation.projectRequestValidationSchema),
  ProjectController.requestProject,
);

router.get(
  "/:projectId/requests",
  auth(Role.BUYER),
  ProjectController.getProjectRequests,
);

router.get(
  "/:projectId/activity",
  auth(Role.SOLVER, Role.BUYER, Role.ADMIN),
  ProjectController.getProjectActivity,
);

router.post(
  "/assign",
  auth(Role.BUYER),
  validateRequest(ProjectValidation.assignSolverValidationSchema),
  ProjectController.assignSolver,
);

router.get(
  "/:id",
  auth(Role.SOLVER, Role.BUYER, Role.ADMIN, Role.USER),
  ProjectController.getProjectById,
);

router.patch(
  "/:id",
  auth(Role.BUYER),
  validateRequest(ProjectValidation.updateProjectValidationSchema),
  ProjectController.updateProject,
);

router.delete(
  "/:id",
  auth(Role.BUYER),
  ProjectController.deleteProject,
);

export const ProjectRoutes = router;
