import { Request, Response } from "express";
import httpStatus from "http-status";
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
  // File URL is already handled by middleware and put into req.body.file
  // But we still need to validate file type if it wasn't done in middleware or if we want stricter checks.
  // The middleware just uploads whatever is there. 
  // Ideally, multer filter or middleware should handle type check.
  // For now, let's assume valid file if URL exists.
  
  // Note: fileName might need to be extracted from somewhere if not passed in body.
  // If middleware uploaded it, we lost original filename unless we passed it.
  // We can modify middleware to pass metadata or just use a default.
  // Or simpler: req.file is still there? Middleware calls next(), so req.file MIGHT still be there if we didn't clear it.
  // Yes, req.file persists.
  
  let fileUrl = req.body.file;
  
  // Check MIME type if file was uploaded (req.file exists)
  if (req.file) {
      const allowedMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "multipart/x-zip",
      "application/x-compressed",
      "application/x-rar-compressed", // RAR
      "application/x-iso9660-image", // ISO
      "application/octet-stream" // Generic binary
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(zip|rar|iso|7z|tar|gz)$/i)) {
      throw new Error("Only archive files (ZIP, RAR, ISO) are allowed");
    }
  }

  if (!fileUrl) {
    throw new Error("File or File URL is required");
  }

  const taskId = req.params.taskId || req.body.taskId;
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
  const taskId = req.params.taskId || req.body.taskId;
  const result = await TaskService.reviewTask({
    ...req.body,
    taskId,
    buyerId: user?.id,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task reviewed successfully!",
    data: result,
  });
});

const getLatestSubmission = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const { taskId } = req.params;
    const result = await TaskService.getLatestSubmission(taskId, user?.id, user?.role);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Latest submission retrieved successfully",
        data: result,
    });
});

export const TaskController = {
  createTask,
  submitTask,
  reviewTask,
  getLatestSubmission
};
