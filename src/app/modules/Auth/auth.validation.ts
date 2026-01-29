import { z } from "zod";

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const registerValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    role: z.enum(["SOLVER", "BUYER","USER"]), // User can request a role, but backend enforces default if needed
    avatarUrl: z.string().url().optional(),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required!"),
  }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string(),
    newPassword: z.string().min(6),
  }),
});

const verifyOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string(),
  }),
});

const resendOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  registerValidationSchema,
  refreshTokenValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  verifyOtpValidationSchema,
  resendOtpValidationSchema,
};
