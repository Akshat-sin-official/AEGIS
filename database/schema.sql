-- A.E.G.I.S — MySQL schema for authentication, trusted contexts, sessions, audit
-- MySQL 8.0+ recommended (utf8mb4)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS aegis_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aegis_auth;

-- ---------------------------------------------------------------------------
-- users: credentials, lockout, TOTP secret (base32)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  failed_attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL DEFAULT NULL,
  totp_enabled TINYINT(1) NOT NULL DEFAULT 1,
  totp_secret VARCHAR(128) NULL DEFAULT NULL COMMENT 'Base32-encoded TOTP secret',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- trusted_login_contexts: known "IP + device" pairs — skip TOTP when matched
-- (Google-style: new device/location prompts step-up)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trusted_login_contexts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) NOT NULL COMMENT 'IPv4 or IPv6 string',
  device_fingerprint VARCHAR(128) NOT NULL,
  label VARCHAR(255) NULL DEFAULT NULL COMMENT 'Optional human location hint',
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_trust (user_id, ip_address, device_fingerprint),
  KEY idx_user (user_id),
  CONSTRAINT fk_trust_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- sessions: server-side session rows (cookie holds opaque session id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(64) NOT NULL PRIMARY KEY COMMENT 'Opaque session token (hashed or random id)',
  user_id BIGINT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  device_fingerprint VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_expires (expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- authentication_logs: immutable audit trail (read-only via app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authentication_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL DEFAULT NULL,
  email_attempt VARCHAR(255) NULL DEFAULT NULL,
  ip_address VARCHAR(45) NOT NULL,
  device_fingerprint VARCHAR(128) NOT NULL,
  event_type ENUM(
    'register',
    'login_success',
    'login_fail',
    'totp_required',
    'totp_success',
    'totp_fail',
    'logout',
    'lockout',
    'account_locked',
    'ip_blocked'
  ) NOT NULL,
  detail VARCHAR(512) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_time (user_id, created_at),
  KEY idx_created (created_at),
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- ip_blocks: temporary blocks after abuse (PRD: after 5 failed, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ip_blocks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  blocked_until DATETIME NOT NULL,
  reason VARCHAR(255) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ip (ip_address)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
