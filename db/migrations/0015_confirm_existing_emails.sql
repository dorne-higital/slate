-- Accounts made before email confirmation existed count as confirmed
UPDATE "user" SET "email_verified" = true WHERE "email_verified" = false;
