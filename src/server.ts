import { Server as HTTPServer } from "http";
import app from "./app";
import prisma from "./shared/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

const port = 5000;

async function ensureAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@proflow.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);
    await prisma.user.create({
      data: {
        email: "admin@proflow.com",
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        isVerified: true,
        name: "Super Admin",
      },
    });
    console.log(
      "✅ Default Admin created (email: admin@proflow.com, password: Admin@123)",
    );
  } else {
    console.log("ℹ️ Admin already exists, skipping creation.");
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
