import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getTokenExpiryDate } from "../src/lib/rate-limit";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding UCBS Onboarding database...\n");

  const passwordHash = await bcrypt.hash("hradmin123", 12);

  const hrUser = await prisma.hRUser.upsert({
    where: { email: "hr@ucbs.com" },
    update: {},
    create: {
      email: "hr@ucbs.com",
      passwordHash,
      name: "HR Administrator",
      role: "HR",
    },
  });

  console.log("✅ HR User created:");
  console.log("   Email: hr@ucbs.com");
  console.log("   Password: hradmin123\n");

  const employee = await prisma.employee.upsert({
    where: { employeeId: "UCBS-2026-001" },
    update: {},
    create: {
      employeeId: "UCBS-2026-001",
      fullName: "Priya Sharma",
      department: "Information Technology",
      designation: "Software Engineer",
      reportingManager: "Rajesh Kumar",
      dateOfJoining: new Date("2026-07-15"),
      workLocation: "Head Office",
      officialEmail: "priya.sharma@ucbs.com",
      personalEmail: "priya.personal@gmail.com",
      mobileNumber: "9876543210",
      status: "INVITED",
    },
  });

  await prisma.onboardingToken.updateMany({
    where: { employeeId: employee.id, isActive: true },
    data: { isActive: false },
  });

  const token = await prisma.onboardingToken.create({
    data: {
      employeeId: employee.id,
      expiresAt: getTokenExpiryDate(),
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  console.log("✅ Sample employee created:");
  console.log(`   Name: ${employee.fullName}`);
  console.log(`   ID: ${employee.employeeId}`);
  console.log(`   Onboarding link: ${appUrl}/onboard/${token.token}\n`);

  console.log("🎉 Seed complete!");
  console.log("\nNext steps:");
  console.log("  1. npm run dev");
  console.log("  2. Open http://localhost:3000/admin/login");
  console.log("  3. Login with hr@ucbs.com / hradmin123");
  console.log(`  4. Or test joinee flow: ${appUrl}/onboard/${token.token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
