import { z } from "zod";

const createProjectValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(4, "Title must be at least 4 characters")
      .max(120, "Title must be at most 120 characters"),
    description: z
      .string()
      .min(30, "Description must be at least 30 characters")
      .max(5000, "Description must be at most 5000 characters"),
    skillsRequired: z
      .array(
        z
          .string()
          .min(2, "Skill must be at least 2 characters")
          .max(30, "Skill must be at most 30 characters")
      )
      .min(1, "At least one skill is required")
      .max(20, "At most 20 skills are allowed"),
    deadline: z.string().datetime({ message: "Invalid datetime format" }).optional(),
    budget: z.number().optional(),
    coverImageUrl: z.string().url("Invalid URL").optional(),
    coverImageName: z.string().optional(),
  }),
});

const updateProjectValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(4, "Title must be at least 4 characters")
      .max(120, "Title must be at most 120 characters")
      .optional(),
    description: z
      .string()
      .min(30, "Description must be at least 30 characters")
      .max(5000, "Description must be at most 5000 characters")
      .optional(),
    skillsRequired: z
      .array(
        z
          .string()
          .min(2, "Skill must be at least 2 characters")
          .max(30, "Skill must be at most 30 characters")
      )
      .min(1, "At least one skill is required")
      .max(20, "At most 20 skills are allowed")
      .optional(),
    deadline: z.string().datetime({ message: "Invalid datetime format" }).optional(),
    budget: z.number().optional(),
    coverImageUrl: z.string().url("Invalid URL").optional(),
    coverImageName: z.string().optional(),
  }),
});

const projectRequestValidationSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    message: z.string().optional(),
  }),
});

const assignSolverValidationSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    solverId: z.string().min(1, "Solver ID is required"),
  }),
});

export const ProjectValidation = {
  createProjectValidationSchema,
  updateProjectValidationSchema,
  projectRequestValidationSchema,
  assignSolverValidationSchema,
};
