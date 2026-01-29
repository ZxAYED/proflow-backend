import { z } from "zod";
import { SubmissionStatus, TaskStatus } from "@prisma/client";

const createTaskValidationSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.IN_PROGRESS),
    timeline: z.string().datetime({ message: "Invalid datetime format" }),
  }),
});

const submitTaskValidationSchema = z.object({
  body: z.object({
    taskId: z.string().min(1, "Task ID is required"),
    file: z.string().url("File URL must be a valid URL").optional(),
  }),
});

const reviewTaskValidationSchema = z.object({
  body: z.object({
    taskId: z.string().min(1, "Task ID is required"),
    status: z.enum([SubmissionStatus.ACCEPTED, SubmissionStatus.REJECTED]),
    reviewComments: z.string().min(1, "Review comments are required"),
  }),
});

export const TaskValidation = {
  createTaskValidationSchema,
  submitTaskValidationSchema,
  reviewTaskValidationSchema,
};
