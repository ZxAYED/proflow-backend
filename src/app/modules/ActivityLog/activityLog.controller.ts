import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ActivityLogService } from "./activityLog.service";

const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ActivityLogService.getActivityLogs(user?.id, user?.role);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity logs fetched successfully!",
    data: result,
  });
});

export const ActivityLogController = {
  getActivityLogs,
};
