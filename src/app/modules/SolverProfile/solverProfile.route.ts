import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { Role } from "@prisma/client";
import { SolverProfileController } from "./solverProfile.controller";
import { SolverProfileValidation } from "./solverProfile.validation";

const router = express.Router();

// Public route to view profile
router.get("/:id", SolverProfileController.getProfileById);

// Protected routes (Solver only)
router.get("/me/profile", auth(Role.SOLVER), SolverProfileController.getMyProfile);
router.patch(
  "/me/profile",
  auth(Role.SOLVER),
  validateRequest(SolverProfileValidation.updateProfileSchema),
  SolverProfileController.updateProfile
);

// Education
router.post(
  "/education",
  auth(Role.SOLVER),
  validateRequest(SolverProfileValidation.addEducationSchema),
  SolverProfileController.addEducation
);
router.delete("/education/:id", auth(Role.SOLVER), SolverProfileController.deleteEducation);

// Experience
router.post(
  "/experience",
  auth(Role.SOLVER),
  validateRequest(SolverProfileValidation.addExperienceSchema),
  SolverProfileController.addExperience
);
router.delete("/experience/:id", auth(Role.SOLVER), SolverProfileController.deleteExperience);

// Personal Projects
router.post(
  "/projects",
  auth(Role.SOLVER),
  validateRequest(SolverProfileValidation.addProjectSchema),
  SolverProfileController.addProject
);
router.delete("/projects/:id", auth(Role.SOLVER), SolverProfileController.deleteProject);

export const SolverProfileRoutes = router;
