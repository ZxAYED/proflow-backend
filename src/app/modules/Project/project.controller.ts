import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { ProjectService } from "./project.service";
import pick from "../../../shared/pick";

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProject(req.body);
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

const requestProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.requestProject(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Project request sent successfully!",
    data: result,
  });
});

const getProjectRequests = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ProjectService.getProjectRequests(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project requests retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const assignSolver = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.assignSolver(req.body);
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
  requestProject,
  getProjectRequests,
  assignSolver,
};
