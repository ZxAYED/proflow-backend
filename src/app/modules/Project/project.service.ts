import {
    Prisma,
    ProjectStatus,
    RequestStatus
} from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { logActivity } from "../../../shared/activityLog";
import prisma from "../../../shared/prisma";
import { sendNotificationEmail } from "../../../utils/notificationSender";
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
      skills: payload.skillsRequired,
      timeline: new Date(payload.timeline),
      deadline: new Date(payload.timeline),
      buyerId: payload.buyerId,
      budget: payload.budget,
      status: ProjectStatus.OPEN,
      tags: payload.skillsRequired, // Populate tags for now as well
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

  // Add tags/skills filter if provided
  if ((filterData as any).skills) {
    const skills = ((filterData as any).skills as string).split(",");
    whereConditions.skills = {
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
        },
      },
      assignedSolver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      requests: {
        include: {
          solver: {
            select: {
              id: true,
              name: true,
              email: true,
              solverProfile: true,
            },
          },
        },
      },
    },
  });
  return result;
};

// Update Project
const updateProject = async (
  id: string,
  payload: Partial<ICreateProjectPayload> & { buyerId: string },
) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found");

  if (project.buyerId !== payload.buyerId) {
    throw new Error("You are not authorized to update this project");
  }

  if (project.status === ProjectStatus.ASSIGNED) {
    // Block editing core fields
    if (payload.title || payload.skillsRequired) {
      throw new Error(
        "Cannot edit core fields (title, skills) after project is assigned",
      );
    }
  }

  const updateData: any = { ...payload };
  if (payload.skillsRequired) {
    updateData.skills = payload.skillsRequired;
    updateData.tags = payload.skillsRequired;
    delete updateData.skillsRequired;
  }
  if (payload.timeline) {
    updateData.timeline = new Date(payload.timeline);
    updateData.deadline = new Date(payload.timeline);
  }
  delete updateData.buyerId; // Don't update buyerId

  const result = await prisma.project.update({
    where: { id },
    data: updateData,
  });

  return result;
};

// Delete Project
const deleteProject = async (id: string, buyerId: string) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error("Project not found");

  if (project.buyerId !== buyerId) {
    throw new Error("You are not authorized to delete this project");
  }

  const result = await prisma.project.delete({
    where: { id },
  });

  return result;
};

// Request Project (Solver)
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
    throw new Error("You have already requested to work on this project");
  }

  const result = await prisma.workRequest.create({
    data: {
      projectId: payload.projectId,
      solverId: payload.solverId,
      message: payload.message,
      status: RequestStatus.PENDING,
    },
    include: {
      project: { include: { buyer: true } },
      solver: true,
    },
  });

  // Notify Buyer
  if (result.project.buyer.email) {
    await sendNotificationEmail(
      result.project.buyer.email,
      "New Project Request",
      `Solver <strong>${result.solver.name || "A user"}</strong> has requested to work on your project: ${result.project.title}.`,
      `https://proflow.com/projects/${result.project.id}/requests`,
      "View Request",
    );
  }

  await logActivity(
    "PROJECT_REQUESTED",
    `Request sent for project ${project.title}`,
    payload.solverId,
    project.id,
  );

  return result;
};

// Get Project Requests (Buyer)
const getProjectRequests = async (projectId: string, buyerId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("Project not found");
  if (project.buyerId !== buyerId) throw new Error("Unauthorized");

  const result = await prisma.workRequest.findMany({
    where: { projectId },
    include: {
      solver: {
        include: {
          solverProfile: true,
        },
      },
    },
  });
  return result;
};

// Assign Solver (Buyer)
const assignSolver = async (payload: IProjectAssignPayload, buyerId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.buyerId !== buyerId) {
    throw new Error("You are not authorized to assign a solver for this project");
  }

  if (project.assignedSolverId) {
    throw new Error("Project is already assigned to a solver");
  }

  // Transaction: Update Project -> Accept Request -> Reject Others
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Project
    const updatedProject = await tx.project.update({
      where: { id: payload.projectId },
      data: {
        assignedSolverId: payload.solverId,
        status: ProjectStatus.ASSIGNED,
      },
      include: {
        assignedSolver: true,
        buyer: true,
      },
    });

    // 2. Accept this request
    await tx.workRequest.update({
      where: {
        projectId_solverId: {
          projectId: payload.projectId,
          solverId: payload.solverId,
        },
      },
      data: {
        status: RequestStatus.ACCEPTED,
      },
    });

    // 3. Reject/Withdraw others
    await tx.workRequest.updateMany({
      where: {
        projectId: payload.projectId,
        solverId: { not: payload.solverId },
        status: RequestStatus.PENDING,
      },
      data: {
        status: RequestStatus.REJECTED,
      },
    });

    return updatedProject;
  });

  // Notify Solver
  if (result.assignedSolver?.email) {
    await sendNotificationEmail(
      result.assignedSolver.email,
      "Project Assigned",
      `You have been assigned to the project: <strong>${result.title}</strong>.`,
      `https://proflow.com/projects/${result.id}`,
      "View Project",
    );
  }

  await logActivity(
    "SOLVER_ASSIGNED",
    `Solver assigned to project ${result.title}`,
    buyerId,
    result.id,
  );

  return result;
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
};
