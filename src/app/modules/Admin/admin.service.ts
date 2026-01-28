import { ProjectStatus, Role, Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { sendRoleAssignedEmail } from "../../utils/emailSender";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";

// Assign Buyer Role
const assignBuyerRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: Role.BUYER,
      isVerified: true,
    },
  });

  // Send email notification
  await sendRoleAssignedEmail(user.email, "BUYER");

  return updatedUser;
};

// Get All Users
const getAllUsers = async (options: any, filters: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const searchFields = ["email", "name"];
  const filterableFields = ["role", "isVerified"];

  const whereConditions = buildDynamicFilters(
    { searchTerm, ...filterData },
    searchFields,
    filterableFields,
  ) as Prisma.UserWhereInput;

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.user.count({
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

// Get User By Id
const getUserById = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      solverProfile: true,
      buyerProfile: true,
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
      assignedSolver: {
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

// Assign Project to Solver
const assignProject = async (projectId: string, solverId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const solver = await prisma.user.findUnique({
    where: { id: solverId, role: Role.SOLVER },
  });

  if (!solver) {
    throw new Error("Solver not found or invalid role");
  }

  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      assignedSolverId: solverId,
      status: ProjectStatus.ASSIGNED,
    },
  });

  return result;
};

export const AdminService = {
  assignBuyerRole,
  getAllUsers,
  getUserById,
  getAllProjects,
  assignProject,
};
