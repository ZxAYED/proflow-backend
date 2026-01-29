import { Request, Response } from "express";
import httpStatus from "http-status";
import { uploadFileToSupabase } from "../../../helpers/uploadFileToSupabase";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
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
  let fileUrl = req.body.file;

  if (req.file) {
    // ZIP-only enforcement
    const allowedMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "multipart/x-zip",
      "application/x-compressed",
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Only ZIP files are allowed for submissions");
    }

    fileUrl = await uploadFileToSupabase(req.file);
  }

  if (!fileUrl) {
    throw new Error("File or File URL is required");
  }

  const { taskId } = req.body;
  const result = await TaskService.submitTask({
    taskId,
    fileUrl,
    fileName: req.file?.originalname || req.body.fileName || "submission.zip",
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
