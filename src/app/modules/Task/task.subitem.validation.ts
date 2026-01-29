import { z } from "zod";

const createSubItemValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters"),
    isDone: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

const updateSubItemValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120).optional(),
    isDone: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const TaskSubItemValidation = {
  createSubItemValidationSchema,
  updateSubItemValidationSchema,
};
