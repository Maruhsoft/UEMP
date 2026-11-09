-- Align existing demo accounts with the PBKDF2 iteration limit supported by Cloudflare Workers Web Crypto.
-- DEMO ONLY: all four demo users share the non-production password documented in README.md.
UPDATE users
SET password_salt='WdsprOsw3M_KepzLmyqi3w',
    password_hash='JkEDBRqO0kV6eIDuG8uTgOx0GbKZZAkfsWWrKPRR2pc'
WHERE id IN ('user-admin','user-hod','user-lecturer','user-student')
  AND email IN ('admin@uemp.demo','hod@uemp.demo','lecturer@uemp.demo','student@uemp.demo');
