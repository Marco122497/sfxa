-- Password-reset SMS OTP columns on profiles
-- Safe to re-run in Supabase SQL Editor.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.otp_code IS
    'Active password-reset SMS OTP (cleared after verify or expiry).';
COMMENT ON COLUMN profiles.otp_expires_at IS
    'When the active otp_code expires.';
COMMENT ON COLUMN profiles.otp_verified_at IS
    'Set when OTP is verified; allows password reset for a short window.';
