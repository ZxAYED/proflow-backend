import { ProjectStatus, RequestStatus, Role, TaskStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";

const getDashboardStats = async (userId: string, role: string) => {
  const stats: any = {};

  if (role === Role.BUYER) {
    // 1. Project counts by status
    const projectCounts = await prisma.project.groupBy({
      by: ["status"],
      where: { buyerId: userId },
      _count: { id: true },
    });

    // 2. Pending Requests Count
    // Requests for projects owned by this buyer
    const pendingRequestsCount = await prisma.workRequest.count({
      where: {
        project: { buyerId: userId },
        status: RequestStatus.PENDING,
      },
    });

    // 3. Tasks awaiting review
    const tasksToReviewCount = await prisma.task.count({
      where: {
        project: { buyerId: userId },
        status: TaskStatus.SUBMITTED,
      },
    });

    stats.projectCounts = projectCounts;
    stats.pendingRequestsCount = pendingRequestsCount;
    stats.tasksToReviewCount = tasksToReviewCount;
  } else if (role === Role.SOLVER) {
    // 1. Assigned Projects Count
    const assignedProjectsCount = await prisma.project.count({
      where: { assignedSolverId: userId },
    });

    // 2. Tasks Due Soon (next 7 days) & In Progress
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const tasksDueSoonCount = await prisma.task.count({
      where: {
        solverId: userId,
        status: TaskStatus.IN_PROGRESS,
        deadline: {
          lte: nextWeek,
          gte: new Date(), // Not overdue (optional)
        },
      },
    });

    // 3. Submissions Status (Active)
    const activeSubmissionsCount = await prisma.submission.count({
        where: {
            solverId: userId,
            // Assuming we care about total or specific status?
            // "submissions status" requested - let's give count of submitted
        }
    });

    stats.assignedProjectsCount = assignedProjectsCount;
    stats.tasksDueSoonCount = tasksDueSoonCount;
    stats.activeSubmissionsCount = activeSubmissionsCount;

  } else if (role === Role.ADMIN) {
    // 1. User counts by role
    const userCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });

    // 2. Total Projects
    const totalProjects = await prisma.project.count();
    
    // 3. Total Revenue (mock or real if budget exists)
    // const totalBudget = await prisma.project.aggregate({ _sum: { budget: true } });

    stats.userCounts = userCounts;
    stats.totalProjects = totalProjects;
  }

  return stats;
};

export const DashboardService = {
  getDashboardStats,
};
