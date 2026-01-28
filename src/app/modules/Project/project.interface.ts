import { ProjectStatus, TaskStatus } from "@prisma/client";

export type IProjectFilterRequest = {
  searchTerm?: string;
  status?: ProjectStatus;
  buyerId?: string;
  assignedSolverId?: string;
};

export type IProjectRequestPayload = {
  projectId: string;
  solverId: string;
  message?: string;
};

export type IProjectAssignPayload = {
  projectId: string;
  solverId: string;
};

export type ICreateProjectPayload = {
  title: string;
  description: string;
  skillsRequired: string[];
  timeline: string;
  buyerId: string;
  budget?: number;
};
