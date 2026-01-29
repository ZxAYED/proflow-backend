import express from "express";
import upload from "../../../helpers/upload";
import { fileUploadHandler } from "../../middlewares/fileUploadHandler";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/register",
  upload.single("file"),
  fileUploadHandler("avatarUrl", "image"),
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser,
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser,
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken,
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthController.resetPassword,
);

router.post(
  "/resend-otp",
  validateRequest(AuthValidation.forgotPasswordValidationSchema), // Reuse schema as it only needs email
  AuthController.forgotPassword, // Reuse logic as it generates and sends OTP
);

export const AuthRoutes = router;
