import { ProjectStatus, RequestStatus, Role, WorkRequest } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { IPaginationOptions } from "../../../interfaces/pagination";
import { logActivity } from "../../../shared/activityLog";
import prisma from "../../../shared/prisma";

const createWorkRequest = async (
  userId: string,
  payload: { projectId: string; proposal?: string; bidAmount?: number }
) => {
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
      solverId: userId,
    },
  });

  if (existingRequest) {
    throw new Error("You have already submitted a request for this project");
  }

  const result = await prisma.workRequest.create({
    data: {
      projectId: payload.projectId,
      solverId: userId,
      status: RequestStatus.PENDING,
      // proposal and bidAmount are not in the schema yet, but good to have for future
      // For now, we only use basic relation
    },
  });

  await logActivity(
    "REQUEST_CREATED",
    `Solver requested to work on project ${project.title}`,
    userId,
    project.id
  );

  return result;
};

const getWorkRequests = async (
  userId: string,
  role: Role,
  options: IPaginationOptions
): Promise<IGenericResponse<WorkRequest[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions: any = {};

  if (role === Role.SOLVER) {
    whereConditions.solverId = userId;
  } else if (role === Role.BUYER) {
    // Buyer sees requests for their projects
    whereConditions.project = {
      buyerId: userId,
    };
  }

  const result = await prisma.workRequest.findMany({
    where: whereConditions,
    include: {
      project: true,
      solver: {
        select: {
          id: true,
          email: true,
          solverProfile: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.workRequest.count({
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

const acceptWorkRequest = async (buyerId: string, requestId: string) => {
  const request = await prisma.workRequest.findUnique({
    where: { id: requestId },
    include: { project: true },
  });

  if (!request) {
    throw new Error("Work request not found");
  }

  if (request.project.buyerId !== buyerId) {
    throw new Error("You are not authorized to accept requests for this project");
  }

  if (request.project.status !== ProjectStatus.OPEN) {
    throw new Error("Project is already assigned or closed");
  }

  // Transaction to update everything safely
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update the accepted request
    const acceptedRequest = await tx.workRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.ACCEPTED },
    });

    // 2. Reject all other pending requests for this project
    await tx.workRequest.updateMany({
      where: {
        projectId: request.projectId,
        id: { not: requestId },
        status: RequestStatus.PENDING,
      },
      data: { status: RequestStatus.REJECTED },
    });

    // 3. Update the Project status and assign solver
    await tx.project.update({
      where: { id: request.projectId },
      data: {
        status: ProjectStatus.ASSIGNED,
        assignedSolverId: request.solverId,
      },
    });

    return acceptedRequest;
  });

  await logActivity(
    "REQUEST_ACCEPTED",
    `Buyer accepted request from solver for project ${request.project.title}`,
    buyerId,
    request.projectId
  );

  return result;
};

export const WorkRequestService = {
  createWorkRequest,
  getWorkRequests,
  acceptWorkRequest,
};
