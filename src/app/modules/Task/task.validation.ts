import { SubmissionStatus, TaskStatus } from "@prisma/client";
import { z } from "zod";

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
  params: z.object({
    taskId: z.string().min(1, "Task ID is required"),
  }),
  body: z.object({
    file: z.string().url("File URL must be a valid URL").optional(),
  }),
});

const reviewTaskValidationSchema = z.object({
  params: z.object({
    taskId: z.string().min(1, "Task ID is required"),
  }),
  body: z.object({
    status: z.enum([SubmissionStatus.ACCEPTED, SubmissionStatus.REJECTED]),
    reviewComments: z.string().optional(),
  }).refine((data) => {
    if (data.status === SubmissionStatus.REJECTED) {
      return !!data.reviewComments && data.reviewComments.trim().length > 0;
    }
    return true;
  }, {
    message: "Review comments are required when rejecting a submission",
    path: ["reviewComments"],
  }),
});

export const TaskValidation = {
  createTaskValidationSchema,
  submitTaskValidationSchema,
  reviewTaskValidationSchema,
};
