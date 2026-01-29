import { z } from "zod";

const createWorkRequestValidationSchema = z.object({
  body: z.object({
    projectId: z.string({
      required_error: "Project ID is required",
    }),
    proposal: z.string().optional(),
    bidAmount: z.number().optional(),
  }),
});

const acceptWorkRequestValidationSchema = z.object({
  body: z.object({
    requestId: z.string({
      required_error: "Request ID is required",
    }),
  }),
});

export const WorkRequestValidation = {
  createWorkRequestValidationSchema,
  acceptWorkRequestValidationSchema,
};
