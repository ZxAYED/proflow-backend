import { RequestStatus, Role, TaskStatus } from "@prisma/client";
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
    const pendingRequestsCount = await prisma.workRequest.count({
      where: {
        project: { buyerId: userId },
        status: RequestStatus.PENDING,
      },
    });

    // 3. Tasks awaiting review (SUBMITTED)
    const tasksNeedingReviewCount = await prisma.task.count({
      where: {
        project: { buyerId: userId },
        status: TaskStatus.SUBMITTED,
      },
    });

    // 4. Recent Activity (latest 10)
    // Activities where this user is the actor OR related to their projects
    // But usually activity feed is about what happened in their projects.
    // The prompt says "Activity feed GET /projects/:projectId/activity".
    // For dashboard "recentActivity (latest 10)", it probably means aggregation across all projects.
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        OR: [
            { actorId: userId }, // Actions by me
            { project: { buyerId: userId } } // Actions in my projects
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { name: true, avatarUrl: true, email: true } },
        project: { select: { title: true } },
        task: { select: { title: true } }
      }
    });

    stats.myProjects = projectCounts; // Map to requested name
    stats.pendingRequestsCount = pendingRequestsCount;
    stats.tasksNeedingReviewCount = tasksNeedingReviewCount;
    stats.recentActivity = recentActivity;

  } else if (role === Role.SOLVER) {
    // 1. Assigned Projects Count
    const assignedProjectsCount = await prisma.project.count({
      where: { assignedSolverId: userId },
    });

    // 2. Tasks In Progress
    const tasksInProgressCount = await prisma.task.count({
      where: {
        solverId: userId,
        status: TaskStatus.IN_PROGRESS
      }
    });

    // 3. Submissions Pending Review (SUBMITTED)
    const submissionsPendingReviewCount = await prisma.task.count({
        where: {
            solverId: userId,
            status: TaskStatus.SUBMITTED
        }
    });

    // 4. Tasks Due Soon (deadline within 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const tasksDueSoon = await prisma.task.findMany({
      where: {
        solverId: userId,
        status: TaskStatus.IN_PROGRESS,
        deadline: {
          lte: nextWeek,
          gte: new Date(),
        },
      },
      select: { id: true, title: true, deadline: true, project: { select: { title: true } } },
      take: 5 // Limit list
    });

    // 5. Recent Activity
    const recentActivity = await prisma.activityLog.findMany({
        where: {
          OR: [
              { actorId: userId },
              { project: { assignedSolverId: userId } }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
            actor: { select: { name: true, avatarUrl: true } },
            project: { select: { title: true } },
            task: { select: { title: true } }
        }
    });

    stats.assignedProjectsCount = assignedProjectsCount;
    stats.tasksInProgressCount = tasksInProgressCount;
    stats.submissionsPendingReviewCount = submissionsPendingReviewCount;
    stats.tasksDueSoon = tasksDueSoon;
    stats.recentActivity = recentActivity;

  } else if (role === Role.ADMIN) {
    // 1. User counts by role
    const userCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });

    // 2. Projects count by status
    const projectCounts = await prisma.project.groupBy({
        by: ["status"],
        _count: { id: true }
    });
    
    // 3. Tasks count by status
    const taskCounts = await prisma.task.groupBy({
        by: ["status"],
        _count: { id: true }
    });

    // 4. Latest 10 activity logs
    const recentActivity = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            actor: { select: { name: true, email: true, role: true } },
            project: { select: { title: true } }
        }
    });

    stats.userCounts = userCounts;
    stats.projectCounts = projectCounts;
    stats.taskCounts = taskCounts;
    stats.recentActivity = recentActivity;
  }

  return stats;
};

export const DashboardService = {
  getDashboardStats,
};
