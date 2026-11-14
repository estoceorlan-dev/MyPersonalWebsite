import jwt from "jsonwebtoken";

const DEFAULT_JWT_SECRET =
  "orlandone-portfolio-owner-jwt-secret-change-in-production-2026";

function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;
}

export type JwtOwnerPayload = {
  sub: number;
  email: string;
};

export function signOwnerToken(payload: JwtOwnerPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyOwnerToken(token: string): JwtOwnerPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as {
      sub?: number | string;
      email?: string;
    };
    if (!decoded || !decoded.email || decoded.sub === undefined) return null;
    return {
      sub: Number(decoded.sub),
      email: String(decoded.email),
    };
  } catch {
    return null;
  }
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
export const AUTH_RATE_LIMIT_MAX = 5;
export const AUTH_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    return {
      allowed: true,
      remaining: AUTH_RATE_LIMIT_MAX,
      retryAfterSeconds: 0,
    };
  }
  if (record.count >= AUTH_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }
  return {
    allowed: true,
    remaining: Math.max(0, AUTH_RATE_LIMIT_MAX - record.count),
    retryAfterSeconds: 0,
  };
}

export function recordLoginAttempt(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = loginAttempts.get(ip);
  const record =
    !existing || now > existing.resetAt
      ? { count: 0, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS }
      : existing;

  if (record.count >= AUTH_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  loginAttempts.set(ip, record);
  return {
    allowed: true,
    remaining: Math.max(0, AUTH_RATE_LIMIT_MAX - record.count),
    retryAfterSeconds: 0,
  };
}

export function clearFailedLogins(ip: string): void {
  loginAttempts.delete(ip);
}
