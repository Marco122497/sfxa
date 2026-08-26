"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  ROLES,
  buildFullName,
  getDashboardPath,
  type UserRole,
} from "@/lib/auth/roles";
import {
  clearProfileOtpVerified,
  clearResetOkCookie,
  codesMatch,
  generateOtpCode,
  isOtpStillValid,
  isOtpVerifiedRecently,
  markProfileOtpVerified,
  readOtpSessionCookie,
  readProfileOtp,
  readResetOkCookie,
  saveProfileOtp,
  setOtpSessionCookie,
  setResetOkCookie,
} from "@/lib/auth/password-reset-otp";
import {
  maskMobile,
  normalizePhMobile,
  phoneLookupVariants,
  sendSemaphoreOtp,
} from "@/lib/sms/semaphore";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  step?: "phone" | "otp";
  phoneMasked?: string;
};

async function getRequestMeta() {
  const headerStore = await headers();
  return {
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      null,
    device: headerStore.get("user-agent") || null,
  };
}

export async function register(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");
  const first_name = String(formData.get("first_name") || "").trim();
  const middle_name = String(formData.get("middle_name") || "").trim() || null;
  const last_name = String(formData.get("last_name") || "").trim();
  const suffix = String(formData.get("suffix") || "").trim() || null;
  const employee_no = String(formData.get("employee_no") || "").trim() || null;
  const role = String(formData.get("role") || "").trim() as UserRole;

  if (!email || !password || !first_name || !last_name || !role) {
    return { error: "Please fill in all required fields." };
  }

  if (!ROLES.includes(role)) {
    return { error: "Please select a valid role." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Password and confirmation do not match." };
  }

  const full_name = buildFullName({
    first_name,
    middle_name,
    last_name,
    suffix,
  });

  // Same pattern as burnout-detection: admin createUser with email already
  // confirmed — no confirmation email, so no Supabase email rate limit.
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration is not configured.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        error:
          "Registration is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the dev server.",
      };
    }
    return { error: message };
  }

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        middle_name,
        last_name,
        suffix,
        employee_no,
        full_name,
        role,
      },
    });

    if (error) {
      const rawMessage = (error.message || "").trim();
      const message =
        (rawMessage && rawMessage !== "{}" ? rawMessage : null) ||
        (error.code ? `Registration failed (${error.code})` : null) ||
        (error.status ? `Registration failed (HTTP ${error.status})` : null) ||
        "Registration failed. Please try again.";

      if (/already|registered|exists/i.test(message)) {
        return { error: "An account with this email already exists." };
      }

      // New sb_secret_ keys can fail admin routes on projects using ES256 JWTs.
      if (/jwt|kid|es256|unrecognized|unverifiable|bad_jwt/i.test(message)) {
        return {
          error:
            "Invalid service role key. In Supabase → Project Settings → API → Legacy API keys, copy the service_role key (starts with eyJ…) into SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the dev server.",
        };
      }

      // Auth returns HTTP 500 when the profiles trigger fails / is missing.
      if (
        error.status === 500 ||
        /database error|unexpected_failure|500/i.test(message)
      ) {
        return {
          error:
            "Database setup error while creating your profile. In Supabase → SQL Editor, run the file sql/registration-trigger.sql, then try again.",
        };
      }

      return { error: message };
    }

    if (!data.user) {
      return { error: "Registration failed. Please try again." };
    }

    // Ensure profile exists / fields are set (trigger usually handles insert)
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!existing) {
      const { error: profileError } = await admin.from("profiles").insert({
        id: data.user.id,
        employee_no,
        first_name,
        middle_name,
        last_name,
        suffix,
        full_name,
        role,
        status: true,
      });

      if (profileError) {
        return {
          error: `Account created but profile failed: ${profileError.message || "unknown error"}`,
        };
      }
    } else {
      await admin
        .from("profiles")
        .update({
          employee_no,
          first_name,
          middle_name,
          last_name,
          suffix,
          full_name,
          role,
          status: true,
        })
        .eq("id", data.user.id);
    }

    const meta = await getRequestMeta();
    await admin.from("audit_logs").insert({
      user_id: data.user.id,
      action: "REGISTER",
      table_name: "profiles",
      description: `Registered as ${role}`,
      ip_address: meta.ip,
    });

    // Return success instead of redirect() — redirect() throws and useActionState
    // can surface that as a useless "{}" error.
    return {
      success: "Account created successfully. Redirecting to sign in…",
    };
  } catch (err) {
    const message =
      err instanceof Error && err.message && err.message !== "{}"
        ? err.message
        : "Registration failed. Please try again.";
    return { error: message };
  }
}

export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: error?.message || "Invalid email or password." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return {
        error:
          "Your account has no profile yet. Ask an administrator to set up your access.",
      };
    }

    if (!profile.status) {
      await supabase.auth.signOut();
      return { error: "Your account is deactivated. Contact an administrator." };
    }

    const meta = await getRequestMeta();
    const now = new Date().toISOString();

    await supabase
      .from("profiles")
      .update({ last_login: now })
      .eq("id", data.user.id);

    await supabase.from("login_history").insert({
      user_id: data.user.id,
      login_time: now,
      ip_address: meta.ip,
      device_info: meta.device,
    });

    await supabase.from("audit_logs").insert({
      user_id: data.user.id,
      action: "LOGIN",
      table_name: "profiles",
      description: "User signed in",
      ip_address: meta.ip,
    });

    return {
      success: "Signed in successfully.",
      redirectTo: getDashboardPath(profile.role),
    };
  } catch (err) {
    const message =
      err instanceof Error && err.message && err.message !== "{}"
        ? err.message
        : "Sign in failed. Please try again.";
    return { error: message };
  }
}

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const meta = await getRequestMeta();

    const { data: openLogin } = await supabase
      .from("login_history")
      .select("login_id")
      .eq("user_id", user.id)
      .is("logout_time", null)
      .order("login_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openLogin?.login_id) {
      await supabase
        .from("login_history")
        .update({ logout_time: new Date().toISOString() })
        .eq("login_id", openLogin.login_id);
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "LOGOUT",
      table_name: "profiles",
      description: "User signed out",
      ip_address: meta.ip,
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}

async function findProfileByMobile(rawPhone: string) {
  const admin = createAdminClient();
  const number = normalizePhMobile(rawPhone);

  if (!number) {
    return { admin, profile: null, number: null as string | null };
  }

  const variants = phoneLookupVariants(number);
  const { data, error } = await admin
    .from("profiles")
    .select("id, contact_number, status")
    .not("contact_number", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const profile =
    (data ?? []).find((row) => {
      const stored = String(row.contact_number || "").trim();
      if (!stored) return false;
      if (variants.includes(stored)) return true;
      const normalizedStored = normalizePhMobile(stored);
      return normalizedStored === number;
    }) ?? null;

  return { admin, profile, number };
}

async function issuePasswordResetOtp(
  rawPhone: string
): Promise<AuthActionState> {
  let admin;
  let profile;
  let number: string | null;

  try {
    ({ admin, profile, number } = await findProfileByMobile(rawPhone));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to start password reset.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        error:
          "Password reset is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the dev server.",
        step: "phone",
      };
    }
    return { error: message, step: "phone" };
  }

  if (!number) {
    return {
      error: "Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX).",
      step: "phone",
    };
  }

  if (!profile) {
    return {
      error:
        "This mobile number is not registered. Check the number or contact an administrator.",
      step: "phone",
    };
  }

  if (profile.status === false) {
    return {
      error: "Your account is deactivated. Contact an administrator.",
      step: "phone",
    };
  }

  const { data: authUser, error: authError } =
    await admin.auth.admin.getUserById(profile.id);

  if (authError || !authUser.user) {
    return {
      error:
        "This mobile number is not registered. Check the number or contact an administrator.",
      step: "phone",
    };
  }

  const email = authUser.user.email?.toLowerCase() || "";
  const code = generateOtpCode();
  const phoneMasked = maskMobile(number);

  try {
    await sendSemaphoreOtp({
      number,
      code,
      message:
        "Your SFXA Finance password reset code is {otp}. Valid for 10 minutes. Do not share this code.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send verification SMS.";
    if (message.includes("SEMAPHORE_API_KEY")) {
      return {
        error:
          "SMS is not configured. Add SEMAPHORE_API_KEY to .env.local, then restart the dev server.",
        step: "phone",
      };
    }
    return { error: message, step: "phone" };
  }

  try {
    await saveProfileOtp(admin, profile.id, code);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save verification code.";
    if (/otp_code|column|schema/i.test(message)) {
      return {
        error:
          "Database is missing OTP columns. In Supabase → SQL Editor, run sql/password-reset-otp.sql, then try again.",
        step: "phone",
      };
    }
    return { error: message, step: "phone" };
  }

  await setOtpSessionCookie({
    userId: profile.id,
    email,
    phoneNormalized: number,
    phoneMasked,
  });

  return {
    success: "Verification code sent.",
    step: "otp",
    phoneMasked,
  };
}

export async function forgotPassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const mobile = String(formData.get("mobile") || "").trim();

  if (!mobile) {
    return { error: "Mobile number is required.", step: "phone" };
  }

  return issuePasswordResetOtp(mobile);
}

export async function resendPasswordResetOtp(
  _prev: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  const challenge = await readOtpSessionCookie();
  const phone = challenge?.phoneNormalized || "";

  if (!phone) {
    return {
      error: "Enter your mobile number again to resend a code.",
      step: "phone",
    };
  }

  return issuePasswordResetOtp(phone);
}

export async function verifyPasswordResetOtp(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const otp = String(formData.get("otp") || "").replace(/\D/g, "");

  if (otp.length !== 6) {
    return {
      error: "Enter the 6-digit verification code.",
      step: "otp",
    };
  }

  const session = await readOtpSessionCookie();
  if (!session) {
    return {
      error: "Your verification code expired. Request a new one.",
      step: "phone",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Password reset is not configured.";
    return { error: message, step: "otp", phoneMasked: session.phoneMasked };
  }

  let stored;
  try {
    stored = await readProfileOtp(admin, session.userId);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to verify code.";
    if (/otp_code|column|schema/i.test(message)) {
      return {
        error:
          "Database is missing OTP columns. In Supabase → SQL Editor, run sql/password-reset-otp.sql, then try again.",
        step: "phone",
      };
    }
    return { error: message, step: "otp", phoneMasked: session.phoneMasked };
  }

  if (!stored?.otp_code || !isOtpStillValid(stored.otp_expires_at)) {
    return {
      error: "Your verification code expired. Request a new one.",
      step: "phone",
    };
  }

  if (!codesMatch(otp, stored.otp_code)) {
    return {
      error: "Invalid verification code. Please try again.",
      step: "otp",
      phoneMasked: session.phoneMasked,
    };
  }

  await markProfileOtpVerified(admin, session.userId);
  await setResetOkCookie({
    userId: session.userId,
    email: session.email,
  });

  return {
    success: "Code verified. Choose a new password.",
    redirectTo: "/reset-password",
  };
}

export async function changePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!newPassword || !confirmPassword) {
    return { error: "Please fill in all password fields." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You must be signed in to change your password." };
  }

  // Re-authenticate when changing password from an active session
  if (currentPassword) {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (reauthError) {
      return { error: "Current password is incorrect." };
    }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  const meta = await getRequestMeta();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CHANGE_PASSWORD",
    table_name: "auth.users",
    description: "User changed password",
    ip_address: meta.ip,
  });

  revalidatePath("/profile");
  revalidatePath("/change-password");

  return { success: "Password updated successfully." };
}

export async function resetPassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!newPassword || !confirmPassword) {
    return { error: "Please fill in all password fields." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  // Preferred path: recovery/magic-link session already established.
  if (sessionUser) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { error: error.message };
    }

    const meta = await getRequestMeta();
    await supabase.from("audit_logs").insert({
      user_id: sessionUser.id,
      action: "RESET_PASSWORD",
      table_name: "auth.users",
      description: "User reset password via email link",
      ip_address: meta.ip,
    });

    await clearResetOkCookie();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (profile?.role) {
      redirect(getDashboardPath(profile.role));
    }

    redirect("/login?reset=success");
  }

  // OTP path: verified SMS code grants a short-lived reset cookie + DB flag.
  const resetOk = await readResetOkCookie();
  if (!resetOk) {
    return {
      error:
        "Your password reset session expired. Start again from Forgot password.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Password reset is not configured.";
    return { error: message };
  }

  const stored = await readProfileOtp(admin, resetOk.userId);
  if (!isOtpVerifiedRecently(stored?.otp_verified_at)) {
    await clearResetOkCookie();
    return {
      error:
        "Your password reset session expired. Start again from Forgot password.",
    };
  }

  const { error } = await admin.auth.admin.updateUserById(resetOk.userId, {
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  const meta = await getRequestMeta();
  await admin.from("audit_logs").insert({
    user_id: resetOk.userId,
    action: "RESET_PASSWORD",
    table_name: "auth.users",
    description: "User reset password via SMS OTP",
    ip_address: meta.ip,
  });

  await clearProfileOtpVerified(admin, resetOk.userId);
  await clearResetOkCookie();
  redirect("/login?reset=success");
}
