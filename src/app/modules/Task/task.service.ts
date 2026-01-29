import {
    Prisma,
    Role,
    SubmissionStatus,
    TaskStatus
} from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { logActivity } from "../../../shared/activityLog";
import prisma from "../../../shared/prisma";
import { sendNotificationEmail } from "../../../utils/notificationSender";
import {
    ICreateTaskPayload,
    IReviewTaskPayload,
    ISubmitTaskPayload,
} from "./task.interface";

// Create Task
const createTask = async (payload: ICreateTaskPayload) => {
  // Verify project assignment
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.assignedSolverId !== payload.solverId) {
    throw new Error("You are not assigned to this project");
  }

  const result = await prisma.task.create({
    data: {
      projectId: payload.projectId,
      solverId: payload.solverId,
      title: payload.title,
      description: payload.description,
      timeline: new Date(payload.timeline),
      deadline: new Date(payload.timeline), // Mirror
      status: payload.status || TaskStatus.IN_PROGRESS,
    },
  });

  await logActivity(
    "TASK_CREATED",
    `Task ${result.title} created`,
    payload.solverId,
    project.id,
    result.id,
  );

  return result;
};

// Get Tasks (with filters and pagination)
const getTasks = async (options: any, filters: any, userId: string, role: string) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const searchFields = ["title", "description"];
  const filterableFields = ["status", "projectId", "solverId"];

  const whereConditions = buildDynamicFilters(
    { searchTerm, ...filterData },
    searchFields,
    filterableFields,
  ) as Prisma.TaskWhereInput;

  // Role-based filtering
  if (role === Role.SOLVER) {
    whereConditions.solverId = userId;
  } else if (role === Role.BUYER) {
    // Buyer can see tasks for their projects
    whereConditions.project = {
      buyerId: userId,
    };
  }

  const result = await prisma.task.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      project: {
        select: {
          title: true,
          buyerId: true,
        },
      },
      submissions: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    },
  });

  const total = await prisma.task.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Submit Task
const submitTask = async (payload: ISubmitTaskPayload) => {
  const task = await prisma.task.findUnique({
    where: { id: payload.taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.solverId !== payload.solverId) {
    throw new Error("You are not the owner of this task");
  }

  // State Transition Check: Must be IN_PROGRESS or REJECTED (if re-submitting)
  // Actually, REJECTED status sets task back to IN_PROGRESS in reviewTask, so status should be IN_PROGRESS.
  // But let's allow REJECTED just in case it wasn't flipped, though logic below says it should be.
  if (task.status !== TaskStatus.IN_PROGRESS) {
    throw new Error("Task must be IN_PROGRESS to submit");
  }

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      taskId: payload.taskId,
      solverId: payload.solverId,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      status: SubmissionStatus.SUBMITTED,
    },
  });

  // Update task status
  const updatedTask = await prisma.task.update({
    where: { id: payload.taskId },
    data: {
      status: TaskStatus.SUBMITTED,
    },
    include: { project: { include: { buyer: true } } }, // Include buyer for email
  });

  // Notify Buyer
  if (updatedTask.project.buyer.email) {
    await sendNotificationEmail(
      updatedTask.project.buyer.email,
      "Task Submitted",
      `A task <strong>${updatedTask.title}</strong> has been submitted for review.<br>Project: ${updatedTask.project.title}`,
      `https://proflow.com/tasks/${updatedTask.id}/review`,
      "Review Submission",
    );
  }

  await logActivity(
    "TASK_SUBMITTED",
    `Task ${updatedTask.title} submitted`,
    payload.solverId,
    updatedTask.projectId,
    updatedTask.id,
  );

  return submission;
};

// Review Task (Buyer)
const reviewTask = async (payload: IReviewTaskPayload) => {
  const task = await prisma.task.findUnique({
    where: { id: payload.taskId },
    include: {
      project: true,
      solver: true, // Include solver for email
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.project.buyerId !== payload.buyerId) {
    throw new Error("You are not the owner of this project");
  }

  if (task.status !== TaskStatus.SUBMITTED) {
    throw new Error("Task is not in SUBMITTED state");
  }

  // Find the latest submission
  const submission = await prisma.submission.findFirst({
    where: { taskId: payload.taskId },
    orderBy: { createdAt: "desc" },
  });

  if (!submission) {
    throw new Error("No submission found for this task");
  }

  // Update submission status
  const updatedSubmission = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: payload.status,
      reviewComments: payload.reviewComments,
    },
  });

  // Update task status based on review
  if (payload.status === SubmissionStatus.ACCEPTED) {
    await prisma.task.update({
      where: { id: payload.taskId },
      data: {
        status: TaskStatus.COMPLETED,
      },
    });

    // Notify Solver (Accepted)
    if (task.solver.email) {
      await sendNotificationEmail(
        task.solver.email,
        "Task Accepted",
        `Your submission for task <strong>${task.title}</strong> has been ACCEPTED.<br>Comments: ${payload.reviewComments}`,
        `https://proflow.com/tasks/${task.id}`,
        "View Task",
      );
    }

    await logActivity(
      "TASK_ACCEPTED",
      `Task ${task.title} accepted`,
      payload.buyerId,
      task.projectId,
      task.id,
    );

  } else if (payload.status === SubmissionStatus.REJECTED) {
    await prisma.task.update({
      where: { id: payload.taskId },
      data: {
        status: TaskStatus.IN_PROGRESS, // Revert to in progress for re-work
      },
    });

    // Notify Solver (Rejected)
    if (task.solver.email) {
      await sendNotificationEmail(
        task.solver.email,
        "Task Rejected",
        `Your submission for task <strong>${task.title}</strong> has been REJECTED.<br>Comments: ${payload.reviewComments}<br>Please revise and resubmit.`,
        `https://proflow.com/tasks/${task.id}`,
        "View Task",
      );
    }

    await logActivity(
      "TASK_REJECTED",
      `Task ${task.title} rejected`,
      payload.buyerId,
      task.projectId,
      task.id,
    );
  }

  return updatedSubmission;
};

export const TaskService = {
  createTask,
  getTasks,
  submitTask,
  reviewTask,
};
