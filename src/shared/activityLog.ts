import { ActivityAction, PrismaClient } from "@prisma/client";
import { ACTIVITY_EVENT, eventBus } from "./events";
import prisma from "./prisma";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const logActivity = async (
  action: ActivityAction,
  message: string,
  actorId: string,
  projectId?: string | null,
  taskId?: string | null,
  submissionId?: string | null,
  tx?: PrismaTransaction | any // Allow any for transaction client
) => {
  try {
    const db = tx || prisma;
    
    const log = await db.activityLog.create({
      data: {
        action,
        message,
        actorId,
        projectId,
        taskId,
        submissionId,
      },
    });

    // Emit event for SSE
    // We need to know who should receive this. 
    // Usually it's the project participants.
    // We can fetch project participants here or pass them.
    // For performance, let's fetch only if we don't have them, or just emit with projectId 
    // and let the SSE handler decide/fetch logic.
    // The SSE handler will need to know if a connected user is part of the project.
    
    eventBus.emit(ACTIVITY_EVENT, {
        ...log,
        projectId, // Ensure projectId is top level for easy filtering
    });

  } catch (error) {
    console.error("Failed to create activity log:", error);
    // Non-blocking
  }
};
