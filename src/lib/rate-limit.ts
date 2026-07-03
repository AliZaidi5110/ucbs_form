import crypto from "crypto";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

export function createSignedToken(payload: string, expiresInSeconds = 3600): string {
  const secret = process.env.UPLOAD_SECRET || "dev-secret";
  const expires = Date.now() + expiresInSeconds * 1000;
  const data = `${payload}:${expires}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  return Buffer.from(`${data}:${signature}`).toString("base64url");
}

export function verifySignedToken(token: string, expectedPayload: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [payload, expiresStr, signature] = decoded.split(":");
    if (payload !== expectedPayload) return false;
    if (Date.now() > Number(expiresStr)) return false;
    const secret = process.env.UPLOAD_SECRET || "dev-secret";
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${payload}:${expiresStr}`)
      .digest("hex");
    return signature === expectedSig;
  } catch {
    return false;
  }
}

export function getTokenExpiryDate(): Date {
  const days = Number(process.env.TOKEN_EXPIRY_DAYS || 30);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
