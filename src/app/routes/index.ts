import express from "express";
import { AdminRoutes } from "../modules/Admin/admin.route";
import { AuthRoutes } from "../modules/Auth/auth.route";

import { ActivityLogRoutes } from "../modules/ActivityLog/activityLog.route";
import { DashboardRoutes } from "../modules/Dashboard/dashboard.route";
import { ProjectRoutes } from "../modules/Project/project.route";
import { RealtimeRoutes } from "../modules/Realtime/realtime.route";
import { SolverProfileRoutes } from "../modules/SolverProfile/solverProfile.route";
import { TaskRoutes } from "../modules/Task/task.route";
import { TaskSubItemRoutes } from "../modules/Task/task.subitem.route";
import { WorkRequestRoutes } from "../modules/WorkRequest/workRequest.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/projects",
    route: ProjectRoutes,
  },
  {
    path: "/requests",
    route: WorkRequestRoutes,
  },
  {
    path: "/tasks",
    route: TaskRoutes,
  },
  {
    path: "/task-items",
    route: TaskSubItemRoutes,
  },
  {
    path: "/activity-logs",
    route: ActivityLogRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/realtime",
    route: RealtimeRoutes,
  },
  {
    path: "/solver-profiles",
    route: SolverProfileRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
