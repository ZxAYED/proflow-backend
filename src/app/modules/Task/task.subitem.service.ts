import { ActivityAction, TaskStatus } from "@prisma/client";
import httpStatus from "http-status";
import AppError from "../../Errors/AppError";
import prisma from "../../../shared/prisma";
import { ICreateSubItemPayload, IUpdateSubItemPayload } from "./task.subitem.interface";

const createSubItem = async (
  taskId: string,
  payload: ICreateSubItemPayload,
  userId: string
) => {
  // Check task existence and ownership
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  // Only assigned solver can create subitems
  if (task.solverId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to add items to this task");
  }

  // Create subitem
  const result = await prisma.taskSubItem.create({
    data: {
      taskId,
      title: payload.title,
      isDone: payload.isDone || false,
      order: payload.order || 0,
    },
  });

  return result;
};

const getSubItems = async (taskId: string, userId: string) => {
  // Check task existence
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  // Access control: Solver (assigned), Buyer (owner), Admin
  const isSolver = task.solverId === userId;
  const isBuyer = task.project.buyerId === userId;
  
  // Need to check role for Admin, but userId is just ID. 
  // We assume controller passed correct user. If strict role check needed, pass role too.
  // For now, allow Solver and Buyer. Admin usually bypasses or handled in controller/guard.
  // But wait, the prompt says "Only assigned solver can create/update/delete".
  // For LIST, "Buyer can view tasks for their own project".
  
  if (!isSolver && !isBuyer) {
     // Check if admin? We need user role here. 
     // For simplicity, we assume auth middleware let them in if they have rights, 
     // but we should enforce resource ownership.
     // Let's fetch user role if not passed.
     const user = await prisma.user.findUnique({ where: { id: userId } });
     if (user?.role !== "ADMIN") {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied");
     }
  }

  const result = await prisma.taskSubItem.findMany({
    where: { taskId },
    orderBy: { order: "asc" },
  });

  return result;
};

const updateSubItem = async (
  subItemId: string,
  payload: IUpdateSubItemPayload,
  userId: string
) => {
  const subItem = await prisma.taskSubItem.findUnique({
    where: { id: subItemId },
    include: { task: { include: { project: true } } },
  });

  if (!subItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Subitem not found");
  }

  // Only assigned solver can update
  if (subItem.task.solverId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this item");
  }

  const result = await prisma.taskSubItem.update({
    where: { id: subItemId },
    data: payload,
  });

  // Calculate progress and update task? (Optional requirement: "progressPercent")
  // Prompt says: "progressPercent (optional stored, or computed from subitems)"
  // We can compute on read, or update task metadata.
  
  return result;
};

const deleteSubItem = async (subItemId: string, userId: string) => {
  const subItem = await prisma.taskSubItem.findUnique({
    where: { id: subItemId },
    include: { task: true },
  });

  if (!subItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Subitem not found");
  }

  if (subItem.task.solverId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to delete this item");
  }

  await prisma.taskSubItem.delete({
    where: { id: subItemId },
  });

  return { message: "Subitem deleted successfully" };
};

export const TaskSubItemService = {
  createSubItem,
  getSubItems,
  updateSubItem,
  deleteSubItem,
};
