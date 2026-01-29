import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { ProjectService } from "./project.service";

const createProject = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ProjectService.createProject({
    ...req.body,
    buyerId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Project created successfully!",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "status",
    "buyerId",
    "skills",
  ]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await ProjectService.getAllProjects(options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Projects retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getProjectById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project retrieved successfully!",
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ProjectService.updateProject(req.params.id, {
    ...req.body,
    buyerId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project updated successfully!",
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ProjectService.deleteProject(req.params.id, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project deleted successfully!",
    data: result,
  });
});

const requestProject = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ProjectService.requestProject({
    ...req.body,
    solverId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Project request sent successfully!",
    data: result,
  });
});

const getProjectRequests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = req.params;
  const result = await ProjectService.getProjectRequests(projectId, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project requests retrieved successfully!",
    data: result,
  });
});

const assignSolver = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ProjectService.assignSolver(req.body, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Solver assigned successfully!",
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  requestProject,
  getProjectRequests,
  assignSolver,
};
