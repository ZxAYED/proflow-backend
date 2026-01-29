import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { eventBus, ACTIVITY_EVENT } from "../../../shared/events";
import prisma from "../../../shared/prisma";

const subscribe = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    res.status(401).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const onActivity = async (data: any) => {
    try {
      // Filter based on user role and project access
      let hasAccess = false;

      if (user.role === Role.ADMIN) {
        hasAccess = true;
      } else if (data.projectId) {
        // Check project access
        // Optimization: We could cache this or pass buyerId/solverId in event data if available
        // For now, simple DB check
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
          select: { buyerId: true, assignedSolverId: true }
        });

        if (project) {
          if (user.role === Role.BUYER && project.buyerId === user.id) {
            hasAccess = true;
          } else if (user.role === Role.SOLVER && project.assignedSolverId === user.id) {
            hasAccess = true;
          }
        }
      }

      if (hasAccess) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    } catch (error) {
      console.error("SSE Error:", error);
    }
  };

  eventBus.on(ACTIVITY_EVENT, onActivity);

  // Keep alive comment to prevent timeout
  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 30000);

  req.on("close", () => {
    eventBus.off(ACTIVITY_EVENT, onActivity);
    clearInterval(keepAlive);
    res.end();
  });
};

export const RealtimeController = {
  subscribe,
};
