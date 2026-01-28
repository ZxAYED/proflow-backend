import { Prisma, ProjectStatus, TaskStatus } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import {
    ICreateProjectPayload,
    IProjectAssignPayload,
    IProjectRequestPayload,
} from "./project.interface";

// Create Project
const createProject = async (payload: ICreateProjectPayload) => {
  const result = await prisma.project.create({
    data: {
      title: payload.title,
      description: payload.description,
      skillsRequired: payload.skillsRequired, // Using the new field
      tags: payload.skillsRequired, // keeping tags for now as mirror
      timeline: new Date(payload.timeline), // Using timeline
      deadline: new Date(payload.timeline), // Mirror to deadline
      buyerId: payload.buyerId,
      budget: payload.budget,
      status: ProjectStatus.OPEN,
    },
  });
  return result;
};

// Get All Projects
const getAllProjects = async (options: any, filters: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const searchFields = ["title", "description"];
  const filterableFields = ["status", "buyerId", "assignedSolverId"];

  const whereConditions = buildDynamicFilters(
    { searchTerm, ...filterData },
    searchFields,
    filterableFields,
  ) as Prisma.ProjectWhereInput;

  // Add tags/skills filter if provided
  if ((filterData as any).skills) {
    const skills = ((filterData as any).skills as string).split(",");
    whereConditions.tags = {
      hasSome: skills,
    };
  }

  const result = await prisma.project.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.project.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

import { sendNotificationEmail } from "../../../utils/notificationSender";
const requestProject = async (payload: IProjectRequestPayload) => {
  // Check if project exists and is OPEN
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw new Error("Project is not open for requests");
  }

  // Check if request already exists
  const existingRequest = await prisma.workRequest.findUnique({
    where: {
      projectId_solverId: {
        projectId: payload.projectId,
        solverId: payload.solverId,
      },
    },
  });

  if (existingRequest) {
    throw new Error("Request already sent for this project");
  }

  const result = await prisma.workRequest.create({
    data: {
      projectId: payload.projectId,
      solverId: payload.solverId,
      message: payload.message,
      status: TaskStatus.IN_PROGRESS, // Default status for request, though maybe PENDING would be better but reusing TaskStatus
    },
  });

  return result;
};

// Get Project Requests (Admin)
const getProjectRequests = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const result = await prisma.workRequest.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: sortOrder,
    },
    include: {
      project: true,
      solver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.workRequest.count();

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Assign Solver (Admin)
const assignSolver = async (payload: IProjectAssignPayload) => {
  const { projectId, solverId } = payload;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const solver = await prisma.user.findUnique({
    where: { id: solverId },
  });

  if (!solver) {
    throw new Error("Solver not found");
  }

  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      assignedSolverId: solverId,
      status: ProjectStatus.ASSIGNED,
    },
  });

  // Notify Solver
  if (solver.email) {
    await sendNotificationEmail(
      solver.email,
      "Project Assigned",
      `You have been assigned to the project <strong>${project.title}</strong>. You can now start creating tasks.`,
      `https://proflow.com/projects/${project.id}`,
      "View Project",
    );
  }

  return result;
};

export const ProjectService = {
  createProject,
  getAllProjects,
  requestProject,
  getProjectRequests,
  assignSolver,
};
