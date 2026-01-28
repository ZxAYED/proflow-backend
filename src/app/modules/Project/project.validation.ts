import { z } from "zod";

const createProjectValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    skillsRequired: z.array(z.string()).min(1, "At least one skill is required"),
    timeline: z.string().datetime({ message: "Invalid datetime format" }),
    buyerId: z.string().min(1, "Buyer ID is required"),
    budget: z.number().optional(),
  }),
});

const projectRequestValidationSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    solverId: z.string().min(1, "Solver ID is required"),
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
  projectRequestValidationSchema,
  assignSolverValidationSchema,
};
