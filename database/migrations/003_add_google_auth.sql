-- Migration: 003_add_google_auth
-- Cho phép đăng nhập bằng Google:
--   - password_hash có thể NULL (user Google không có password)
--   - google_id lưu Google UID, unique

ALTER TABLE `users`
  MODIFY COLUMN `password_hash` VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN `google_id` VARCHAR(255) NULL DEFAULT NULL AFTER `password_hash`,
  ADD COLUMN `avatar` VARCHAR(500) NULL DEFAULT NULL AFTER `google_id`,
  ADD UNIQUE KEY `uq_users_google_id` (`google_id`);
