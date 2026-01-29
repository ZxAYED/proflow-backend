import {
  ActivityAction,
  Prisma,
  ProjectStatus,
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

  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        projectId: payload.projectId,
        solverId: payload.solverId,
        title: payload.title,
        description: payload.description,
        deadline: new Date(payload.timeline),
        status: payload.status || TaskStatus.IN_PROGRESS,
      },
    });

    // Project status auto-update: ASSIGNED -> IN_PROGRESS
    if (project.status === ProjectStatus.ASSIGNED) {
      await tx.project.update({
        where: { id: project.id },
        data: { status: ProjectStatus.IN_PROGRESS },
      });
      
  
    }

    await logActivity(
      ActivityAction.TASK_CREATED,
      `Task ${task.title} created`,
      payload.solverId,
      project.id,
      task.id,
      null,
      tx 
    );

    return task;
  });

  return result;
};


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
      },
      subtasks: true // Include subtasks for progress calculation
    },
  });

  const total = await prisma.task.count({
    where: whereConditions,
  });

  // Calculate progress for each task
  const dataWithProgress = result.map(task => {
    const totalSubitems = task.subtasks.length;
    const completedSubitems = task.subtasks.filter(st => st.isDone).length;
    const progress = totalSubitems > 0 ? Math.round((completedSubitems / totalSubitems) * 100) : 0;
    
    return {
      ...task,
      progress
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: dataWithProgress,
  };
};

// Submit Task
const submitTask = async (payload: ISubmitTaskPayload) => {
  const task = await prisma.task.findUnique({
    where: { id: payload.taskId },
    include: { project: { include: { buyer: true } } }
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.solverId !== payload.solverId) {
    throw new Error("You are not the owner of this task");
  }

  // State Transition Check: Must be IN_PROGRESS or REJECTED
  if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REJECTED) {
    throw new Error("Task must be IN_PROGRESS or REJECTED to submit");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create submission
    const submission = await tx.submission.create({
      data: {
        taskId: payload.taskId,
        solverId: payload.solverId,
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
        status: SubmissionStatus.SUBMITTED,
      },
    });

    // Update task status
    const updatedTask = await tx.task.update({
      where: { id: payload.taskId },
      data: {
        status: TaskStatus.SUBMITTED,
      },
    });

    // Update Project status to IN_PROGRESS if currently ASSIGNED (auto-update rule)
    if (task.project.status === ProjectStatus.ASSIGNED) {
      await tx.project.update({
        where: { id: task.projectId },
        data: { status: ProjectStatus.IN_PROGRESS },
      });
    }

    await logActivity(
      ActivityAction.SUBMISSION_UPLOADED,
      `Task ${task.title} submitted`,
      payload.solverId,
      task.projectId,
      task.id,
      submission.id,
      tx
    );

    return { submission, task: updatedTask, project: task.project };
  });

  // Notify Buyer
  if (result.project.buyer && result.project.buyer.email) {
    await sendNotificationEmail(
      result.project.buyer.email,
      "Task Submitted",
      `A task <strong>${result.task.title}</strong> has been submitted for review.<br>Project: ${result.project.title}`,
      `https://proflow.com/tasks/${result.task.id}/review`,
      "Review Submission",
    );
  }

  return result.submission;
};

// Review Task (Buyer)
const reviewTask = async (payload: IReviewTaskPayload) => {
  const task = await prisma.task.findUnique({
    where: { id: payload.taskId },
    include: {
      project: true,
      solver: true,
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

  const result = await prisma.$transaction(async (tx) => {
    // Update submission status
    const updatedSubmission = await tx.submission.update({
      where: { id: submission.id },
      data: {
        status: payload.status,
        reviewComments: payload.reviewComments,
        buyerId: payload.buyerId,
        reviewedAt: new Date(),
      },
    });

    let activityAction: ActivityAction;
    let activityMessage: string;

    // Update task status based on review
    if (payload.status === SubmissionStatus.ACCEPTED) {
      await tx.task.update({
        where: { id: payload.taskId },
        data: {
          status: TaskStatus.COMPLETED,
        },
      });
      activityAction = ActivityAction.SUBMISSION_ACCEPTED;
      activityMessage = `Task ${task.title} accepted`;

      // // Check if all tasks completed
      // const allTasks = await tx.task.findMany({
      //   where: { projectId: task.projectId },
      // });
      // const allCompleted = allTasks.every((t) => t.status === TaskStatus.COMPLETED || (t.id === task.id)); // Current task is now completed
      // // Note: The task update above ensures current task is completed in DB if we re-fetch, but we used allTasks which might be stale or not.
      // // Better to check all other tasks + this one.
      // // Or just count tasks not completed.
      const incompleteCount = await tx.task.count({
        where: {
          projectId: task.projectId,
          status: { not: TaskStatus.COMPLETED },
        },
      });
      
      // If incompleteCount is 0, then all tasks are completed.
      if (incompleteCount === 0) {
        await tx.project.update({
          where: { id: task.projectId },
          data: { status: ProjectStatus.COMPLETED },
        });
        
        await logActivity(
            ActivityAction.PROJECT_COMPLETED,
            `Project ${task.project.title} completed`,
            payload.buyerId,
            task.projectId,
            null,
            null,
            tx
        );
      }

    } else { // REJECTED
      await tx.task.update({
        where: { id: payload.taskId },
        data: {
          status: TaskStatus.REJECTED,
        },
      });
      activityAction = ActivityAction.SUBMISSION_REJECTED;
      activityMessage = `Task ${task.title} rejected`;
    }

    await logActivity(
      activityAction,
      activityMessage,
      payload.buyerId,
      task.projectId,
      task.id,
      submission.id,
      tx
    );

    return updatedSubmission;
  });

  // Notify Solver
  if (task.solver.email) {
    const isAccepted = payload.status === SubmissionStatus.ACCEPTED;
    await sendNotificationEmail(
      task.solver.email,
      isAccepted ? "Task Accepted" : "Task Rejected",
      `Your submission for task <strong>${task.title}</strong> has been ${payload.status}.<br>Comments: ${payload.reviewComments || "No comments"}`,
      `https://proflow.com/tasks/${task.id}`,
      "View Task",
    );
  }

  return result;
};

const getLatestSubmission = async (taskId: string, userId: string, role: string) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
    });

    if (!task) {
        throw new Error("Task not found");
    }

    // Access control
    if (role === Role.SOLVER && task.solverId !== userId) {
        throw new Error("Access denied");
    }
    if (role === Role.BUYER && task.project.buyerId !== userId) {
        throw new Error("Access denied");
    }

    const submission = await prisma.submission.findFirst({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        include: {
            solver: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true
                }
            }
        }
    });

    return submission;
};

export const TaskService = {
  createTask,
  getTasks,
  submitTask,
  reviewTask,
  getLatestSubmission
};
