import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await DashboardService.getDashboardStats(user?.id, user?.role);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully!",
    data: result,
  });
});

export const DashboardController = {
  getDashboardStats,
};
