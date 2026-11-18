-- Drop electricity bill tables and enums
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "billings" CASCADE;
DROP TABLE IF EXISTS "electricity_accounts" CASCADE;
DROP TABLE IF EXISTS "electricity_services" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "recipes" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;

DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "BillingStatus";
DROP TYPE IF EXISTS "AccountStatus";
DROP TYPE IF EXISTS "Role";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CUSTOMER');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "BillingStatus" AS ENUM ('UNPAID', 'WAITING_VERIFICATION', 'PAID');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_providers" (
    "id" VARCHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "speed" INTEGER NOT NULL,
    "price_per_month" DECIMAL(14,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "service_provider_id" VARCHAR(36) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "registered_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billings" (
    "id" VARCHAR(36) NOT NULL,
    "subscription_id" VARCHAR(36) NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "due_date" TIMESTAMP(0) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "billings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" VARCHAR(36) NOT NULL,
    "billing_id" VARCHAR(36) NOT NULL,
    "payment_proof" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" VARCHAR(36),
    "verified_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "billings_subscription_id_period_month_period_year_key" ON "billings"("subscription_id", "period_month", "period_year");
CREATE UNIQUE INDEX "payments_billing_id_key" ON "payments"("billing_id");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_provider_id_fkey" FOREIGN KEY ("service_provider_id") REFERENCES "service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billings" ADD CONSTRAINT "billings_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
