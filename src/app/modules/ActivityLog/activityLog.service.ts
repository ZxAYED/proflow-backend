import { Role } from "@prisma/client";
import prisma from "../../../shared/prisma";

const getActivityLogs = async (userId: string, role: string) => {
  // Define strict role-based filters
  const whereConditions: any = {};

  if (role === Role.BUYER) {
    // Buyers see logs related to their projects or tasks in their projects
    // OR logs where they are the actor
    // This can be complex with OR conditions, let's simplify:
    // 1. Logs where userId is them
    // 2. Logs where projectId belongs to them
    
    // First, get all project IDs owned by buyer
    const myProjects = await prisma.project.findMany({
      where: { buyerId: userId },
      select: { id: true },
    });
    const projectIds = myProjects.map((p) => p.id);

    whereConditions.OR = [
      { userId: userId },
      { projectId: { in: projectIds } },
    ];
  } else if (role === Role.SOLVER) {
    // Solvers see logs where they are the actor
    // OR logs related to projects/tasks they are assigned to
    whereConditions.OR = [
      { userId: userId },
      // Ideally we should also find tasks/projects they are assigned to, 
      // but for simplicity and performance, let's stick to actions they did or explicit mentions
      // A better approach for "notifications" is a separate table, but for activity log:
    ];
    
    // Let's broaden it: if they are assigned to a project, they see logs for that project?
    // Maybe too noisy. Let's keep it to their actions + actions on tasks assigned to them.
    
    const myTasks = await prisma.task.findMany({
        where: { solverId: userId },
        select: { id: true }
    });
    const taskIds = myTasks.map(t => t.id);

    whereConditions.OR.push({ taskId: { in: taskIds } });
  } else if (role === Role.ADMIN) {
    // Admin sees all
  }

  const result = await prisma.activityLog.findMany({
    where: whereConditions,
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

export const ActivityLogService = {
  getActivityLogs,
};
