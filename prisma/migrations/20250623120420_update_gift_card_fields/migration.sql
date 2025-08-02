-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('success', 'info', 'error', 'warn');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "billing_model" AS ENUM ('UNLIMITED', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "reservation_status" AS ENUM ('PENDING', 'INCOMPLETE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('CARD', 'CASH', 'QR');

-- CreateEnum
CREATE TYPE "tip_type" AS ENUM ('CASH', 'CHECK', 'SPLIT');

-- CreateEnum
CREATE TYPE "gift_card_transaction_type" AS ENUM ('PURCHASE', 'REDEMPTION', 'REFUND', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" VARCHAR(255),
    "country" TEXT,
    "street" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "state" TEXT,
    "pin" TEXT,
    "image" TEXT,
    "location_id" TEXT,
    "client_id" TEXT,
    "billing_model" TEXT,
    "next_payment_on" TIMESTAMP(3),
    "subscription_id" TEXT,
    "personal_identification_no" TEXT,
    "shopper_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "user_main" BOOLEAN DEFAULT false,
    "password_changed" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "fcm_token" TEXT,
    "last_login" TIMESTAMP(3),
    "client_language_id" TEXT,
    "otp_code" TEXT,
    "otp_expired_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_amount" DOUBLE PRECISION DEFAULT 0,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION DEFAULT 0,
    "tip_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_payment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "pay_period_start" TIMESTAMP(3) NOT NULL,
    "pay_period_end" TIMESTAMP(3) NOT NULL,
    "per_hour_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_amount" DOUBLE PRECISION DEFAULT 0,
    "worked_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tip_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_schedule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "schedule_day" TEXT NOT NULL,
    "schedule_enabled" BOOLEAN NOT NULL DEFAULT true,
    "schedule_from" TIME(6) NOT NULL DEFAULT '00:00:00'::time without time zone,
    "schedule_to" TIME(6) NOT NULL DEFAULT '00:00:00'::time without time zone,

    CONSTRAINT "user_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_clock_in" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clock_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clock_out" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_clock_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_tip" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "reservation_id" TEXT NOT NULL,
    "tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tip_type" "tip_type" NOT NULL DEFAULT 'CASH',
    "cash_amount" DOUBLE PRECISION DEFAULT 0,
    "check_amount" DOUBLE PRECISION DEFAULT 0,
    "check_paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "check_fully_paid" BOOLEAN NOT NULL DEFAULT false,
    "check_last_paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_service_rotation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_service_rotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_rotation_threshold" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "reservation_threshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_rotation_threshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "location_currency" TEXT NOT NULL DEFAULT 'USD',
    "location_name" TEXT NOT NULL,
    "location_timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "location_24_hours" BOOLEAN NOT NULL DEFAULT false,
    "location_number" TEXT NOT NULL,
    "language_id" TEXT,
    "country" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "state" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "send_activation_email" BOOLEAN NOT NULL DEFAULT true,
    "location_email" TEXT NOT NULL,
    "location_phone" TEXT NOT NULL,
    "tip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "languagesId" TEXT,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selected_location" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "selected_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "message" TEXT NOT NULL,
    "message_type" "message_type" NOT NULL DEFAULT 'info',
    "user_id" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_accessrights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_take_cash" BOOLEAN NOT NULL DEFAULT false,
    "can_take_card" BOOLEAN NOT NULL DEFAULT false,
    "can_make_reservation" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_reservation" BOOLEAN NOT NULL DEFAULT false,
    "can_cancel_reservation" BOOLEAN NOT NULL DEFAULT false,
    "can_view_sales" BOOLEAN NOT NULL DEFAULT false,
    "can_view_customers" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_profile" BOOLEAN NOT NULL DEFAULT false,
    "can_view_activity_logs" BOOLEAN NOT NULL DEFAULT false,
    "can_view_settings" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "staff_accessrights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_to_role" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_to_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_schedule" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "schedule_day" TEXT NOT NULL,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "schedule_from" TIME(6) NOT NULL DEFAULT '00:00:00'::time without time zone,
    "schedule_to" TIME(6) NOT NULL DEFAULT '00:00:00'::time without time zone,

    CONSTRAINT "location_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "location_id" TEXT NOT NULL,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "client_language_id" TEXT,
    "reservation_customer_id" TEXT,
    "customersId" TEXT,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "yearly_price" DOUBLE PRECISION NOT NULL,
    "max_devices" INTEGER NOT NULL DEFAULT 0,
    "max_locations" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessrights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "controls" JSONB NOT NULL,

    CONSTRAINT "accessrights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,

    CONSTRAINT "navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_navigation" (
    "id" TEXT NOT NULL,
    "navigation_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "role_navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_navigation" (
    "id" TEXT NOT NULL,
    "navigation_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,

    CONSTRAINT "subscription_navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "registration_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "language_name" TEXT NOT NULL DEFAULT '',
    "language_code" TEXT NOT NULL,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_language" (
    "id" TEXT NOT NULL,
    "language_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "location_language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_languages" (
    "id" TEXT NOT NULL,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "language_id" TEXT NOT NULL,
    "location_id" TEXT,
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT false,
    "location_id" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "material_cost" DOUBLE PRECISION,
    "description" TEXT NOT NULL DEFAULT '',
    "category_id" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "location_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "phone" TEXT NOT NULL,
    "alternate_phone" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "device_id" TEXT,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "fcm_token" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternate_phone" TEXT,
    "password" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "fcm_token" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "image" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_forgot_password" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_forgot_password_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_activity_logs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "reservation_number" INTEGER NOT NULL,
    "staff_id" TEXT,
    "price_total" DOUBLE PRECISION NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "reservation_status" "reservation_status" NOT NULL DEFAULT 'PENDING',
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reservation_customer_id" TEXT NOT NULL,
    "schedule_start_time" TIMESTAMP(3) NOT NULL,
    "schedule_end_time" TIMESTAMP(3) NOT NULL,
    "reservation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" TEXT,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_details" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_transaction" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "reservation_id" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL DEFAULT 'CASH',
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "reservation_tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transaction_detail_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_details" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "value" DECIMAL(65,30),
    "currency" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "payment_method" TEXT NOT NULL,
    "card_summary" TEXT,
    "card_holder_name" TEXT,
    "card_bin" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_charge_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_invoice_id" TEXT,
    "stripe_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_names" (
    "id" TEXT NOT NULL,
    "app_name" TEXT,

    CONSTRAINT "app_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_version" (
    "id" TEXT NOT NULL,
    "app_id" TEXT,
    "app_platform" TEXT NOT NULL DEFAULT '',
    "app_version_number" TEXT DEFAULT '',
    "app_version_build_number" TEXT DEFAULT '',
    "app_version_datetime" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "app_version_optional" BOOLEAN DEFAULT true,
    "app_version_live" BOOLEAN DEFAULT false,
    "deleted_status" BOOLEAN DEFAULT false,

    CONSTRAINT "app_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_language" (
    "id" TEXT NOT NULL,
    "language_id" TEXT NOT NULL,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "active_status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "translation_language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_translation_language" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "translation_language_id" TEXT NOT NULL,

    CONSTRAINT "user_translation_language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_page" (
    "id" TEXT NOT NULL,
    "page_name" TEXT NOT NULL,
    "translation_language_id" TEXT NOT NULL,

    CONSTRAINT "translation_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_page_text" (
    "id" TEXT NOT NULL,
    "translation_page_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "translation" TEXT,

    CONSTRAINT "translation_page_text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_features" (
    "id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,

    CONSTRAINT "subscription_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card" (
    "id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "card_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "number_of_times" INTEGER NOT NULL DEFAULT 1,
    "expiry_date" TIMESTAMP(3),
    "location_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "deleted_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_transaction" (
    "id" TEXT NOT NULL,
    "gift_card_id" TEXT NOT NULL,
    "transaction_type" "gift_card_transaction_type" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "previous_balance" DOUBLE PRECISION NOT NULL,
    "new_balance" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "reservation_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_user_clock_inTouser_schedule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_user_clock_inTouser_schedule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_shopper_reference_key" ON "user"("shopper_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_user_id_key" ON "payroll"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_tip_reservation_id_key" ON "staff_tip"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_tip_user_id_reservation_id_key" ON "staff_tip"("user_id", "reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_service_rotation_user_id_key" ON "staff_service_rotation"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_rotation_threshold_location_id_key" ON "reservation_rotation_threshold"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_client_id_key" ON "location"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_location_number_key" ON "location"("location_number");

-- CreateIndex
CREATE UNIQUE INDEX "selected_location_user_id_key" ON "selected_location"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_accessrights_user_id_key" ON "staff_accessrights"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_device_id_key" ON "device"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "accessrights_user_id_key" ON "accessrights"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_title_key" ON "navigation"("title");

-- CreateIndex
CREATE UNIQUE INDEX "role_navigation_role_id_navigation_id_key" ON "role_navigation"("role_id", "navigation_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_navigation_subscription_id_navigation_id_key" ON "subscription_navigation"("subscription_id", "navigation_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_otp_email_key" ON "registration_otp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "configuration_key_key" ON "configuration"("key");

-- CreateIndex
CREATE UNIQUE INDEX "languages_language_code_key" ON "languages"("language_code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_customer_device_id_key" ON "reservation_customer"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_username_key" ON "customers"("username");

-- CreateIndex
CREATE INDEX "customer_forgot_password_customer_id_idx" ON "customer_forgot_password"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_transaction_invoice_number_key" ON "reservation_transaction"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_transaction_reservation_id_key" ON "reservation_transaction"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_transaction_transaction_detail_id_key" ON "reservation_transaction"("transaction_detail_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_names_app_name_key" ON "app_names"("app_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_translation_language_user_id_key" ON "user_translation_language"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "features_code_key" ON "features"("code");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_card_number_key" ON "gift_card"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_card_code_key" ON "gift_card"("card_code");

-- CreateIndex
CREATE INDEX "_user_clock_inTouser_schedule_B_index" ON "_user_clock_inTouser_schedule"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_payment" ADD CONSTRAINT "payroll_payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_payment" ADD CONSTRAINT "payroll_payment_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedule" ADD CONSTRAINT "user_schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_clock_in" ADD CONSTRAINT "user_clock_in_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_tip" ADD CONSTRAINT "staff_tip_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_tip" ADD CONSTRAINT "staff_tip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_service_rotation" ADD CONSTRAINT "staff_service_rotation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_rotation_threshold" ADD CONSTRAINT "reservation_rotation_threshold_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_languagesId_fkey" FOREIGN KEY ("languagesId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_location" ADD CONSTRAINT "selected_location_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_location" ADD CONSTRAINT "selected_location_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_accessrights" ADD CONSTRAINT "staff_accessrights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_to_role" ADD CONSTRAINT "user_to_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_to_role" ADD CONSTRAINT "user_to_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_schedule" ADD CONSTRAINT "location_schedule_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_customersId_fkey" FOREIGN KEY ("customersId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessrights" ADD CONSTRAINT "accessrights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_navigation" ADD CONSTRAINT "role_navigation_navigation_id_fkey" FOREIGN KEY ("navigation_id") REFERENCES "navigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_navigation" ADD CONSTRAINT "role_navigation_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_navigation" ADD CONSTRAINT "subscription_navigation_navigation_id_fkey" FOREIGN KEY ("navigation_id") REFERENCES "navigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_navigation" ADD CONSTRAINT "subscription_navigation_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_language" ADD CONSTRAINT "location_language_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_language" ADD CONSTRAINT "location_language_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_languages" ADD CONSTRAINT "client_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_languages" ADD CONSTRAINT "client_languages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_customer" ADD CONSTRAINT "reservation_customer_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_forgot_password" ADD CONSTRAINT "customer_forgot_password_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_activity_logs" ADD CONSTRAINT "customer_activity_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_reservation_customer_id_fkey" FOREIGN KEY ("reservation_customer_id") REFERENCES "reservation_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_details" ADD CONSTRAINT "reservation_details_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_details" ADD CONSTRAINT "reservation_details_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_details" ADD CONSTRAINT "reservation_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_transaction" ADD CONSTRAINT "reservation_transaction_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_transaction" ADD CONSTRAINT "reservation_transaction_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "transaction_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_version" ADD CONSTRAINT "app_version_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "app_names"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_language" ADD CONSTRAINT "translation_language_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_translation_language" ADD CONSTRAINT "user_translation_language_translation_language_id_fkey" FOREIGN KEY ("translation_language_id") REFERENCES "translation_language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_translation_language" ADD CONSTRAINT "user_translation_language_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_page" ADD CONSTRAINT "translation_page_translation_language_id_fkey" FOREIGN KEY ("translation_language_id") REFERENCES "translation_language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_page_text" ADD CONSTRAINT "translation_page_text_translation_page_id_fkey" FOREIGN KEY ("translation_page_id") REFERENCES "translation_page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card" ADD CONSTRAINT "gift_card_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card" ADD CONSTRAINT "gift_card_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transaction" ADD CONSTRAINT "gift_card_transaction_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "gift_card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transaction" ADD CONSTRAINT "gift_card_transaction_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transaction" ADD CONSTRAINT "gift_card_transaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_user_clock_inTouser_schedule" ADD CONSTRAINT "_user_clock_inTouser_schedule_A_fkey" FOREIGN KEY ("A") REFERENCES "user_clock_in"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_user_clock_inTouser_schedule" ADD CONSTRAINT "_user_clock_inTouser_schedule_B_fkey" FOREIGN KEY ("B") REFERENCES "user_schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
