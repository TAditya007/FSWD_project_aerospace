-- ═══════════════════════════════════════════════════════════════════════════
-- AEROSPEC TELEMETRY PLATFORM: PRODUCTION MYSQL DATABASE SCHEMA
-- Relational Schema: Users, Payments, OTP Logs, and Admin Approval Workflow
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS `aerospace_db`
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `aerospace_db`;

-- 1. ORGANIZATIONS / TENANTS TABLE
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `slug` VARCHAR(64) UNIQUE NOT NULL,
  `plan_tier` ENUM('cadet', 'orbital_pro', 'interstellar_max') DEFAULT 'cadet',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `org_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(191) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL, -- Stored credentials monitored by root admin
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `status` ENUM('Active', 'Suspended', 'Pending Verification') DEFAULT 'Active',
  `plan_tier` ENUM('cadet', 'orbital_pro', 'interstellar_max') DEFAULT 'cadet',
  `api_key` VARCHAR(128) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. PAYMENTS & SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `order_id` VARCHAR(64) UNIQUE NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `plan_tier` ENUM('cadet', 'orbital_pro', 'interstellar_max') NOT NULL,
  `plan_name` VARCHAR(64) NOT NULL,
  `amount` VARCHAR(32) NOT NULL, -- e.g. '₹3,999/mo'
  `gateway` VARCHAR(64) NOT NULL, -- 'PhonePe', 'Paytm', 'Razorpay', 'UPI_SCAN'
  `payment_id` VARCHAR(128) DEFAULT '9866606967@superyes',
  `utr` VARCHAR(64) NOT NULL, -- 12-digit Bank reference ID
  `status` ENUM('Pending Approval', 'Approved', 'Rejected') DEFAULT 'Pending Approval',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `approved_by` VARCHAR(191) NULL DEFAULT NULL,
  `rejection_reason` TEXT NULL DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_payments_status` (`status`),
  INDEX `idx_payments_utr` (`utr`),
  INDEX `idx_payments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. OTP LOGS TABLE
CREATE TABLE IF NOT EXISTS `otp_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `type` VARCHAR(64) NOT NULL, -- 'PAYMENT_CONFIRMATION', '2FA_LOGIN', 'SIGNUP'
  `status` ENUM('DISPATCHED', 'VERIFIED', 'EXPIRED', 'FAILED') DEFAULT 'DISPATCHED',
  `ip_address` VARCHAR(45) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_email` (`email`),
  INDEX `idx_otp_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. ADMIN ACTIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS `admin_actions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `admin_email` VARCHAR(191) NOT NULL,
  `action` VARCHAR(64) NOT NULL, -- 'APPROVE_SUBSCRIPTION', 'REJECT_SUBSCRIPTION', etc.
  `target` VARCHAR(191) NOT NULL,
  `details` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_actions_admin` (`admin_email`),
  INDEX `idx_admin_actions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Whitelisted Admins & Organization
INSERT INTO `organizations` (`id`, `name`, `slug`, `plan_tier`)
VALUES ('org_apex_orbital', 'Apex Orbital Systems', 'apex-orbital', 'cadet')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `users` (`id`, `org_id`, `name`, `email`, `password`, `role`, `status`, `plan_tier`, `api_key`)
VALUES 
  ('usr_admin_1', 'org_apex_orbital', 'System Admin Vijay', 'vijay@aerospec.com', 'vijay@2007', 'admin', 'Active', 'interstellar_max', 'aero_live_admin_vijay_2007'),
  ('usr_admin_2', 'org_apex_orbital', 'System Admin Aditya', 'aditya@aerospec.com', 'aditya@007', 'admin', 'Active', 'interstellar_max', 'aero_live_admin_aditya_007'),
  ('usr_op_1',    'org_apex_orbital', 'Operator Vijay',     'user@aerospec.com',  'user123',   'user',  'Active', 'cadet',            'aero_live_usr_op_772194')
ON DUPLICATE KEY UPDATE `password`=VALUES(`password`), `role`=VALUES(`role`);
