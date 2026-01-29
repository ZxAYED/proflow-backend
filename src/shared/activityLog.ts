import prisma from "./prisma";

export const logActivity = async (
  action: string,
  details: string,
  userId?: string,
  projectId?: string,
  taskId?: string,
) => {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        details,
        userId,
        projectId,
        taskId,
      },
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
    // Non-blocking: don't throw error if logging fails
  }
};
