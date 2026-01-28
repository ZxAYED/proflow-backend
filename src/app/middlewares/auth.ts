import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import config from "../config";
import { jwtHelpers } from "../utils/jwtHelpers";

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get authorization header
      const token = req.headers.authorization;
      if (!token) {
        throw new Error("You are not authorized");
      }

      // Verify token
      let verifiedUser = null;

      try {
        verifiedUser = jwtHelpers.verifyToken(
          token,
          config.jwt.secret as Secret,
        );
      } catch (err) {
        throw new Error("Invalid token");
      }

      req.user = verifiedUser; // Attach user to request

      // Guard roles
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new Error("Forbidden");
      }

      // Special check for USER role
      // This block is reached if:
      // 1. requiredRoles is empty (route accessible to all authenticated users)
      // 2. OR requiredRoles includes "USER" (explicitly allowing USER role)
      // In these cases, we still want to block actions if the user is strictly just a "USER" (unverified)
      if (verifiedUser.role === "USER") {
        throw new Error(
          "Please wait for admin to verify and change your role to BUYER or SOLVER.",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
