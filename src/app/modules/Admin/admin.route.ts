import express from "express";
import { AdminController } from "./admin.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

router.post(
  "/assign-buyer-role",
  auth(Role.ADMIN),
  AdminController.assignBuyerRole,
);

router.get("/users", auth(Role.ADMIN), AdminController.getAllUsers);

router.get("/user/:userId", auth(Role.ADMIN), AdminController.getUserById);

router.get("/projects", auth(Role.ADMIN), AdminController.getAllProjects);

router.post("/assign-project", auth(Role.ADMIN), AdminController.assignProject);

export const AdminRoutes = router;
