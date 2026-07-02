import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramInitDataUser = {
  id: number;
  username: string | null;
  firstName: string | null;
};

export type TelegramInitDataVerification =
  | {
      ok: true;
      authDate: number;
      user: TelegramInitDataUser;
    }
  | {
      ok: false;
      reason: string;
    };

function parseUser(rawUser: string | null): TelegramInitDataUser | null {
  if (!rawUser) {
    return null;
  }

  let value: unknown;

  try {
    value = JSON.parse(rawUser);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const user = value as Record<string, unknown>;

  if (typeof user.id !== "number") {
    return null;
  }

  return {
    id: user.id,
    username: typeof user.username === "string" ? user.username : null,
    firstName: typeof user.first_name === "string" ? user.first_name : null
  };
}

function secureCompareHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number
): TelegramInitDataVerification {
  if (!initData) {
    return {
      ok: false,
      reason: "missing_init_data"
    };
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");

  if (!receivedHash) {
    return {
      ok: false,
      reason: "missing_hash"
    };
  }

  params.delete("hash");

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number.parseInt(authDateRaw, 10) : Number.NaN;

  if (!Number.isInteger(authDate) || authDate <= 0) {
    return {
      ok: false,
      reason: "invalid_auth_date"
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (nowSeconds - authDate > maxAgeSeconds) {
    return {
      ok: false,
      reason: "expired_init_data"
    };
  }

  const dataCheckString = [...params.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!secureCompareHex(calculatedHash, receivedHash)) {
    return {
      ok: false,
      reason: "invalid_signature"
    };
  }

  const user = parseUser(params.get("user"));

  if (!user) {
    return {
      ok: false,
      reason: "missing_user"
    };
  }

  return {
    ok: true,
    authDate,
    user
  };
}
