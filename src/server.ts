import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { Server as HTTPServer } from "http";
import app from "./app";
import prisma from "./shared/prisma";

const port = 5000;

async function ensureAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@proflow.com" },
  });
  const existingBuyer = await prisma.user.findUnique({
    where: { email: "buyer@proflow.com" },
  });
  const existingSolver = await prisma.user.findUnique({
    where: { email: "solver@proflow.com" },
  });
  const hashedPassword = await bcrypt.hash("123456", 12);
  if (!existingAdmin) {
  
    await prisma.user.create({
      data: {
        email: "admin@proflow.com",
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        isVerified: true,
        name: "Super Admin",
      },
    });
  if (!existingBuyer) {
   
    await prisma.user.create({
      data:   {
        email: "buyer@proflow.com",
        passwordHash: hashedPassword,
        role: Role.BUYER,
        isVerified: true,
        name: "Buyer",
      }
    });}
    console.log(
      "✅ Default Buyer created (email: buyer@proflow.com, password: 123456)",
    );
    if (!existingSolver) {
     
      await prisma.user.create({
        data:   {
          email: "solver@proflow.com",
          passwordHash: hashedPassword,
          role: Role.SOLVER,
          isVerified: true,
          name: "Solver",
        }
      });}
    console.log(
      "✅ Default Solver created (email: solver@proflow.com, password: 123456)",
    );
  } else {
    console.log("ℹ️ Credentials already exists, skipping creation.");
  }
}

async function main() {
  await ensureAdmin();

  const httpServer: HTTPServer = app.listen(port, () => {
    console.log("🚀 Server is running on port", port);
  });
}

main().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
