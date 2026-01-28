import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { AdminService } from "./admin.service";
import pick from "../../../shared/pick";

const assignBuyerRole = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const result = await AdminService.assignBuyerRole(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated to Buyer successfully!",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "role", "isVerified"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await AdminService.getAllUsers(options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await AdminService.getUserById(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "status",
    "buyerId",
    "assignedSolverId",
  ]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await AdminService.getAllProjects(options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Projects retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const assignProject = catchAsync(async (req: Request, res: Response) => {
  const { projectId, solverId } = req.body;
  const result = await AdminService.assignProject(projectId, solverId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project assigned to solver successfully!",
    data: result,
  });
});

export const AdminController = {
  assignBuyerRole,
  getAllUsers,
  getUserById,
  getAllProjects,
  assignProject,
};
