import { ProjectStatus } from "@prisma/client";

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
  deadline?: string;
  buyerId: string;
  budget?: number;
  coverImageUrl?: string;
  coverImageName?: string;
};

export type IUpdateProjectPayload = {
  title?: string;
  description?: string;
  skillsRequired?: string[];
  deadline?: string;
  budget?: number;
  coverImageUrl?: string;
  coverImageName?: string;
};
