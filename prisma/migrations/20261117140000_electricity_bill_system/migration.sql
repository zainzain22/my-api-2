-- Drop legacy tables if they exist from the previous starter schema
DROP TABLE IF EXISTS "recipes";
DROP TABLE IF EXISTS "categories";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('UNPAID', 'WAITING_VERIFICATION', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electricity_services" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "power_va" INTEGER NOT NULL,
    "price_per_kwh" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electricity_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electricity_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "electricity_service_id" INTEGER NOT NULL,
    "customer_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electricity_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billings" (
    "id" SERIAL NOT NULL,
    "electricity_account_id" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "previous_meter" DECIMAL(12,2) NOT NULL,
    "current_meter" DECIMAL(12,2) NOT NULL,
    "consumption" DECIMAL(12,2) NOT NULL,
    "tariff_per_kwh" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "billing_id" INTEGER NOT NULL,
    "payment_proof" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" INTEGER,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "electricity_services_code_key" ON "electricity_services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "electricity_accounts_customer_number_key" ON "electricity_accounts"("customer_number");

-- CreateIndex
CREATE UNIQUE INDEX "billings_electricity_account_id_period_month_period_year_key" ON "billings"("electricity_account_id", "period_month", "period_year");

-- CreateIndex
CREATE UNIQUE INDEX "payments_billing_id_key" ON "payments"("billing_id");

-- AddForeignKey
ALTER TABLE "electricity_accounts" ADD CONSTRAINT "electricity_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electricity_accounts" ADD CONSTRAINT "electricity_accounts_electricity_service_id_fkey" FOREIGN KEY ("electricity_service_id") REFERENCES "electricity_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billings" ADD CONSTRAINT "billings_electricity_account_id_fkey" FOREIGN KEY ("electricity_account_id") REFERENCES "electricity_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
