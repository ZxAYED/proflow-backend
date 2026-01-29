import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { SolverProfileService } from "./solverProfile.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SolverProfileService.getProfile(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const getProfileById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SolverProfileService.getProfile(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SolverProfileService.updateProfile(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const addEducation = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SolverProfileService.addEducation(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Education added successfully",
    data: result,
  });
});

const deleteEducation = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await SolverProfileService.deleteEducation(user.id, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Education deleted successfully",
    data: result,
  });
});

const addExperience = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SolverProfileService.addExperience(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Experience added successfully",
    data: result,
  });
});

const deleteExperience = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await SolverProfileService.deleteExperience(user.id, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Experience deleted successfully",
    data: result,
  });
});

const addProject = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SolverProfileService.addProject(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project added successfully",
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await SolverProfileService.deleteProject(user.id, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project deleted successfully",
    data: result,
  });
});

export const SolverProfileController = {
  getMyProfile,
  getProfileById,
  updateProfile,
  addEducation,
  deleteEducation,
  addExperience,
  deleteExperience,
  addProject,
  deleteProject,
};
