import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error("DIRECT_URL belum di-set di .env");
}

const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const customerPassword = await bcrypt.hash("Customer123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@pln.test" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@pln.test",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@pln.test" },
    update: {},
    create: {
      name: "Pelanggan Demo",
      email: "customer@pln.test",
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });

  await prisma.electricityService.upsert({
    where: { code: "R1-900" },
    update: {},
    create: {
      code: "R1-900",
      name: "Rumah Tangga 900 VA",
      power_va: 900,
      price_per_kwh: 1352,
      is_active: true,
    },
  });

  await prisma.electricityService.upsert({
    where: { code: "R1-1300" },
    update: {},
    create: {
      code: "R1-1300",
      name: "Rumah Tangga 1300 VA",
      power_va: 1300,
      price_per_kwh: 1444.7,
      is_active: true,
    },
  });

  await prisma.electricityService.upsert({
    where: { code: "B1-2200" },
    update: { is_active: false },
    create: {
      code: "B1-2200",
      name: "Bisnis 2200 VA (nonaktif)",
      power_va: 2200,
      price_per_kwh: 1669.53,
      is_active: false,
    },
  });

  console.log("Seed selesai");
  console.log("Admin: admin@pln.test / Admin123!");
  console.log("Customer: customer@pln.test / Customer123!");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
