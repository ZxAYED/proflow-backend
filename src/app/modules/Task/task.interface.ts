import { SubmissionStatus, TaskStatus } from "@prisma/client";

export type ICreateTaskPayload = {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  timeline: string;
  solverId: string; // Extracted from auth token or payload, but service needs it
};

export type ISubmitTaskPayload = {
  taskId: string;
  fileUrl: string;
  fileName?: string;
  solverId: string;
};

export type IReviewTaskPayload = {
  taskId: string;
  status: SubmissionStatus; // ACCEPTED or REJECTED
  reviewComments: string;
  buyerId: string; // To verify ownership
};
