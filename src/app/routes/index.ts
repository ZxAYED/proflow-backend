import express from "express";
import { AdminRoutes } from "../modules/Admin/admin.route";
import { AuthRoutes } from "../modules/Auth/auth.route";

import { ActivityLogRoutes } from "../modules/ActivityLog/activityLog.route";
import { DashboardRoutes } from "../modules/Dashboard/dashboard.route";
import { ProjectRoutes } from "../modules/Project/project.route";
import { TaskRoutes } from "../modules/Task/task.route";
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
    path: "/activity-logs",
    route: ActivityLogRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
