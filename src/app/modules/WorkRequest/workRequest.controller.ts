import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { WorkRequestService } from "./workRequest.service";

const createWorkRequest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await WorkRequestService.createWorkRequest(user?.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Work request submitted successfully!",
    data: result,
  });
});

const getWorkRequests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await WorkRequestService.getWorkRequests(
    user?.id,
    user?.role,
    options
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Work requests fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const acceptWorkRequest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { requestId } = req.body;
  const result = await WorkRequestService.acceptWorkRequest(user?.id, requestId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Work request accepted successfully!",
    data: result,
  });
});

export const WorkRequestController = {
  createWorkRequest,
  getWorkRequests,
  acceptWorkRequest,
};
