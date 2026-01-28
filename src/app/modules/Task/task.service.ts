import {
  SubmissionStatus,
  TaskStatus,
  ProjectStatus,
  Role,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import {
  ICreateTaskPayload,
  IReviewTaskPayload,
  ISubmitTaskPayload,
} from "./task.interface";
import { sendNotificationEmail } from "../../../utils/notificationSender";

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
      status: payload.status,
    },
  });

  return result;
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

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      taskId: payload.taskId,
      solverId: payload.solverId,
      fileUrl: payload.fileUrl,
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

  // Find the latest submission (or specific one, but usually latest)
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

  // Update task status if accepted
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
  }

  return updatedSubmission;
};

export const TaskService = {
  createTask,
  submitTask,
  reviewTask,
};
