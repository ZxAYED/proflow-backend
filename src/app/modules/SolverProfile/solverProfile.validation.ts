import { z } from "zod";

const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.string().optional(), // Text summary
    portfolio: z.string().url().optional(), // Main portfolio URL
  }),
});

const addEducationSchema = z.object({
  body: z.object({
    school: z.string({ required_error: "School is required" }),
    degree: z.string({ required_error: "Degree is required" }),
    startYear: z.string().optional(),
    endYear: z.string().optional(),
  }),
});

const addExperienceSchema = z.object({
  body: z.object({
    company: z.string({ required_error: "Company is required" }),
    role: z.string({ required_error: "Role is required" }),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

const addProjectSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }),
    description: z.string().optional(),
    projectUrl: z.string().url().optional(),
    imageUrl: z.string({ required_error: "Image URL is required" }).url(),
  }),
});

export const SolverProfileValidation = {
  updateProfileSchema,
  addEducationSchema,
  addExperienceSchema,
  addProjectSchema,
};
