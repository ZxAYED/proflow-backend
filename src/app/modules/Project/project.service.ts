import {
    ActivityAction,
    Prisma,
    ProjectStatus,
    Role
} from "@prisma/client";
import httpStatus from "http-status";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { logActivity } from "../../../shared/activityLog";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import {
    ICreateProjectPayload,
    IProjectAssignPayload,
    IProjectRequestPayload,
    IUpdateProjectPayload,
} from "./project.interface";

// Create Project
const createProject = async (payload: ICreateProjectPayload) => {
  const result = await prisma.project.create({
    data: {
      title: payload.title,
      description: payload.description,
      skillsRequired: payload.skillsRequired,
      deadline: payload.deadline ? new Date(payload.deadline) : null,
      buyerId: payload.buyerId,
      budget: payload.budget,
      status: ProjectStatus.OPEN,
      coverImageUrl: payload.coverImageUrl,
      coverImageName: payload.coverImageName,
    },
  });

  await logActivity(
    "PROJECT_CREATED",
    `Project ${result.title} created`,
    payload.buyerId,
    result.id,
  );

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

  // Add skills filter if provided (ANY match)
  if ((filterData as any).skills) {
    const skills = ((filterData as any).skills as string).split(",");
    whereConditions.skillsRequired = {
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
    select: {
      id: true,
      title: true,
      description: true, // We will truncate this in the service response if needed, or frontend does it. Prompt says "shortDescription (first 160 chars)". Prisma doesn't support substring in select easily. We'll map it.
      skillsRequired: true,
      status: true,
      deadline: true,
      createdAt: true,
      budget: true,
      coverImageUrl: true,
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Map to add shortDescription
  const mappedResult = result.map((project) => ({
    ...project,
    shortDescription: project.description.length > 160 ? project.description.substring(0, 160) + "..." : project.description,
  }));

  const total = await prisma.project.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: mappedResult,
  };
};

// Get Project By Id
const getProjectById = async (id: string) => {
  const result = await prisma.project.findUnique({
    where: { id },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          buyerProfile: true,
        },
      },
      assignedSolver: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          solverProfile: true,
        },
      },
      requests: true, // Optionally include requests for buyer context, but maybe handle in separate endpoint or check role
    },
  });
  return result;
};

// Update Project
const updateProject = async (
  projectId: string,
  payload: IUpdateProjectPayload,
  userId: string
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(httpStatus.NOT_FOUND, "Project not found");
  }

  if (project.buyerId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this project");
  }

  // If project is not OPEN, restrict updates
  if (project.status !== ProjectStatus.OPEN) {
    // Allowed: description, deadline, coverImageUrl/Name
    // Blocked: title, skillsRequired, budget
    if (payload.title || payload.skillsRequired || payload.budget) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Cannot update core fields (title, skills, budget) when project is not OPEN"
      );
    }
  }

  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      title: payload.title,
      description: payload.description,
      skillsRequired: payload.skillsRequired,
      deadline: payload.deadline ? new Date(payload.deadline) : undefined,
      budget: payload.budget,
      coverImageUrl: payload.coverImageUrl,
      coverImageName: payload.coverImageName,
    },
  });

  return result;
};

// Delete Project
const deleteProject = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(httpStatus.NOT_FOUND, "Project not found");
  }

  if (project.buyerId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to delete this project");
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete project that is not OPEN (ASSIGNED/COMPLETED/CANCELLED)"
    );
  }

  const result = await prisma.project.delete({
    where: { id: projectId },
  });

  return result;
};

// Request Project (Existing logic, updated for new schema if needed)
const requestProject = async (payload: IProjectRequestPayload) => {
  // Check if project exists and is OPEN
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw new Error("Project is not open for proposals");
  }

  // Check if already requested
  const existingRequest = await prisma.workRequest.findFirst({
    where: {
      projectId: payload.projectId,
      solverId: payload.solverId,
    },
  });

  if (existingRequest) {
    throw new Error("You have already submitted a proposal for this project");
  }

  const result = await prisma.workRequest.create({
    data: {
      projectId: payload.projectId,
      solverId: payload.solverId,
      message: payload.message || "", // Mapping message
    },
  });

  await logActivity(
    ActivityAction.SOLVER_REQUESTED,
    `Solver requested to work on project ${project.title}`,
    payload.solverId,
    project.id
  );

  return result;
};

// Get Project Requests (Existing logic)
const getProjectRequests = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.buyerId !== userId) {
    throw new Error("Not authorized");
  }

  const requests = await prisma.workRequest.findMany({
    where: { projectId },
    include: {
      solver: {
        include: {
          solverProfile: true,
        },
      },
    },
  });

  return requests;
};

// Assign Solver (Existing logic, updated status)
const assignSolver = async (payload: IProjectAssignPayload, buyerId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.buyerId !== buyerId) {
    throw new Error("Not authorized");
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw new Error("Project is not open");
  }

  const result = await prisma.project.update({
    where: { id: payload.projectId },
    data: {
      assignedSolverId: payload.solverId,
      status: ProjectStatus.ASSIGNED,
    },
  });
    
  // Also update the specific request to ACCEPTED and others to REJECTED?
  // The prompt for this phase doesn't explicitly ask for Request logic update, but we should maintain consistency if possible.
  // However, the prompt says "Do NOT implement Requests... in this phase".
  // But since I already have it, I'll leave it as is or minimally touch it. 
  // The previous turn implemented `acceptWorkRequest` in `WorkRequestService`. 
  // `ProjectService.assignSolver` might be redundant or the direct way. 
  // I will keep it for now as it's in the file, but `WorkRequestService` is the "marketplace heart" logic.
  
  return result;
};

const getProjectActivity = async (projectId: string, userId: string, role: string, options: any) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Access control
  const isBuyer = role === Role.BUYER && project.buyerId === userId;
  const isSolver = role === Role.SOLVER && project.assignedSolverId === userId;
  const isAdmin = role === Role.ADMIN;

  if (!isBuyer && !isSolver && !isAdmin) {
    throw new Error("Access denied");
  }

  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.activityLog.findMany({
    where: { projectId },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
        actor: { select: { name: true, avatarUrl: true, email: true } }
    }
  });

  const total = await prisma.activityLog.count({
    where: { projectId },
  });

  return {
    meta: { page, limit, total },
    data: result
  };
};

export const ProjectService = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  requestProject,
  getProjectRequests,
  assignSolver,
  getProjectActivity,
};
