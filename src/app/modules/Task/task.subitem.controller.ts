import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { TaskSubItemService } from "./task.subitem.service";

const createSubItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { taskId } = req.params;
  const result = await TaskSubItemService.createSubItem(taskId, req.body, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subitem created successfully!",
    data: result,
  });
});

const getSubItems = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { taskId } = req.params;
  const result = await TaskSubItemService.getSubItems(taskId, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subitems retrieved successfully!",
    data: result,
  });
});

const updateSubItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params; // subitem id
  const result = await TaskSubItemService.updateSubItem(id, req.body, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subitem updated successfully!",
    data: result,
  });
});

const deleteSubItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  await TaskSubItemService.deleteSubItem(id, user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subitem deleted successfully!",
  });
});

export const TaskSubItemController = {
  createSubItem,
  getSubItems,
  updateSubItem,
  deleteSubItem,
};
