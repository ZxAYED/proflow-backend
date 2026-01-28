import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { TaskService } from "./task.service";

const createTask = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await TaskService.createTask({
    ...req.body,
    solverId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Task created successfully!",
    data: result,
  });
});

const submitTask = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { taskId, file } = req.body;
  const result = await TaskService.submitTask({
    taskId,
    fileUrl: file,
    solverId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task submitted successfully!",
    data: result,
  });
});

const reviewTask = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await TaskService.reviewTask({
    ...req.body,
    buyerId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task reviewed successfully!",
    data: result,
  });
});

export const TaskController = {
  createTask,
  submitTask,
  reviewTask,
};
