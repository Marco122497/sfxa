const OTP_ENDPOINT = "https://api.semaphore.co/api/v4/otp";

export function getSemaphoreConfig() {
  const apiKey = process.env.SEMAPHORE_API_KEY?.trim();
  const senderName = process.env.SEMAPHORE_SENDER_NAME?.trim() || "CKCMSYS";

  if (!apiKey) {
    throw new Error(
      "Missing SEMAPHORE_API_KEY. Add it to .env.local, then restart the dev server."
    );
  }

  return { apiKey, senderName };
}

/** Normalize PH mobile numbers for Semaphore (639XXXXXXXXX). */
export function normalizePhMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return `63${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("63")) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith("9")) {
    return `63${digits}`;
  }

  return null;
}

export function maskMobile(normalized: string): string {
  // 639171234567 → 0917•••4567
  const local = normalized.startsWith("63")
    ? `0${normalized.slice(2)}`
    : normalized;
  if (local.length < 7) return "••••••••";
  return `${local.slice(0, 4)}•••${local.slice(-4)}`;
}

/** Common PH formats for matching stored contact_number values. */
export function phoneLookupVariants(normalized: string): string[] {
  if (!normalized.startsWith("63") || normalized.length !== 12) {
    return [normalized];
  }

  const local = `0${normalized.slice(2)}`;
  const national = normalized.slice(2);

  return Array.from(
    new Set([
      normalized,
      local,
      national,
      `+${normalized}`,
      `+${local}`,
    ])
  );
}

export async function sendSemaphoreOtp(params: {
  number: string;
  message?: string;
  code?: string;
}): Promise<{ code: string }> {
  const { apiKey, senderName } = getSemaphoreConfig();
  const message =
    params.message ??
    "Your SFXA Finance password reset code is {otp}. Valid for 10 minutes.";

  const body = new URLSearchParams({
    apikey: apiKey,
    number: params.number,
    message,
    sendername: senderName,
  });

  if (params.code) {
    body.set("code", params.code);
  }

  const response = await fetch(OTP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Semaphore returned an invalid response.");
  }

  if (!response.ok) {
    const messageFromApi =
      typeof data === "object" &&
      data &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : text.slice(0, 200);
    throw new Error(messageFromApi || "Failed to send OTP SMS.");
  }

  const first = Array.isArray(data) ? data[0] : data;
  const code =
    first &&
    typeof first === "object" &&
    "code" in first &&
    (first as { code: unknown }).code != null
      ? String((first as { code: string | number }).code)
      : params.code;

  if (!code) {
    throw new Error("Semaphore did not return an OTP code.");
  }

  return { code: code.padStart(6, "0").slice(-6) };
}
