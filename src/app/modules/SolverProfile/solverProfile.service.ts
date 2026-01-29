import { SolverProfile } from "@prisma/client";
import httpStatus from "http-status";
import { deleteImageFromSupabase } from "../../../helpers/deleteImageFromSupabase";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";

const getProfile = async (userId: string) => {
  const result = await prisma.solverProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          personalProjects: true,
          education: true,
          experience: true,
        },
      },
    },
  });

  if (!result) {
    // If profile doesn't exist but user is SOLVER, return basic user info or throw?
    // Better to check user existence first.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        personalProjects: true,
        education: true,
        experience: true,
        solverProfile: true,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    
    // If solverProfile is null, we return what we have
    return user;
  }

  return result;
};

const updateProfile = async (userId: string, payload: Partial<SolverProfile>) => {
  // Ensure profile exists
  const profile = await prisma.solverProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...payload,
    },
    update: payload,
  });

  return profile;
};

const addEducation = async (userId: string, payload: any) => {
  return await prisma.education.create({
    data: {
      userId,
      ...payload,
    },
  });
};

const deleteEducation = async (userId: string, educationId: string) => {
  const edu = await prisma.education.findUnique({ where: { id: educationId } });
  if (!edu || edu.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Education record not found or access denied");
  }
  return await prisma.education.delete({ where: { id: educationId } });
};

const addExperience = async (userId: string, payload: any) => {
  return await prisma.experience.create({
    data: {
      userId,
      ...payload,
    },
  });
};

const deleteExperience = async (userId: string, experienceId: string) => {
  const exp = await prisma.experience.findUnique({ where: { id: experienceId } });
  if (!exp || exp.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Experience record not found or access denied");
  }
  return await prisma.experience.delete({ where: { id: experienceId } });
};

const addProject = async (userId: string, payload: any) => {
  return await prisma.personalProject.create({
    data: {
      userId,
      ...payload,
    },
  });
};

const deleteProject = async (userId: string, projectId: string) => {
  const proj = await prisma.personalProject.findUnique({ where: { id: projectId } });
  if (!proj || proj.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Project not found or access denied");
  }

  const result = await prisma.personalProject.delete({ where: { id: projectId } });

  if (proj.imageUrl) {
    // Perform file deletion asynchronously to avoid blocking the response
    // and to ensure DB consistency is prioritized.
    // If file deletion fails, it's a "leak" but not a data integrity issue for the app.
    deleteImageFromSupabase(proj.imageUrl).catch((err) => {
      console.error(`[SolverProfile] Failed to delete image for project ${projectId}:`, err);
    });
  }

  return result;
};

export const SolverProfileService = {
  getProfile,
  updateProfile,
  addEducation,
  deleteEducation,
  addExperience,
  deleteExperience,
  addProject,
  deleteProject,
};
