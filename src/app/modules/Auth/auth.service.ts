import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { Secret } from "jsonwebtoken";
import prisma from "../../../shared/prisma";
import config from "../../config";
import { sendOTPEmail } from "../../utils/emailSender";
import { jwtHelpers } from "../../utils/jwtHelpers";

// Register
const registerUser = async (payload: any) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUserExist) {
    throw new Error("User already exists!");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );

  const userData = {
    email: payload.email,
    passwordHash: hashedPassword,
    role: payload.role === Role.BUYER || payload.role === Role.USER  ? Role.USER : Role.SOLVER, 
    name: payload.name,
  };

  const result = await prisma.user.create({
    data: userData,
  });

  const { passwordHash, ...userWithoutPassword } = result;
  return userWithoutPassword;
};

// Login
const loginUser = async (payload: any) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new Error("User does not exist!");
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordMatched) {
    throw new Error("Password does not match!");
  }

  const { id, email, role } = user;
  const accessToken = jwtHelpers.createToken(
    { id, email, role },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );

  const refreshToken = jwtHelpers.createToken(
    { id, email, role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};

// Refresh Token
const refreshToken = async (token: string) => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as Secret,
    );
  } catch (err) {
    throw new Error("Invalid Refresh Token");
  }

  const { email } = verifiedToken;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!isUserExist) {
    throw new Error("User does not exist!");
  }

  const newAccessToken = jwtHelpers.createToken(
    { id: isUserExist.id, email: isUserExist.email, role: isUserExist.role },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );

  return {
    accessToken: newAccessToken,
  };
};

// Forgot Password
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("User does not exist!");
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { email },
    data: {
      otp,
      otpExpiry,
    },
  });

  await sendOTPEmail(email, otp);
};

// Reset Password
const resetPassword = async (payload: any) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new Error("User does not exist!");
  }

  if (
    user.otp !== payload.otp ||
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { email: payload.email },
    data: {
      passwordHash: hashedPassword,
      otp: null,
      otpExpiry: null,
    },
  });
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
};
