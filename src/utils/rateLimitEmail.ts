import redisClient from "../config/redis.js";

const COOLDOWN_SEQUENCE = [0, 60, 300, 1800]; // 0s, 1min, 5min, 30min
const MAX_ATTEMPTS = 3; // 3 lần gửi lại, lần 4 bị khóa
const LOCKOUT_DURATION = 24 * 60 * 60; // 24 giờ

export interface ResendLimitResult {
  allowed: boolean;
  attempt?: number; // thứ mấy (1, 2, 3, 4+)
  remainingSeconds?: number;
  isLocked?: boolean;
  nextReset?: number;
}

/**
 * Check if user can resend verification email
 * Returns the current attempt number and whether it's allowed
 */
export const checkEmailResendLimit = async (
  email: string,
): Promise<ResendLimitResult> => {
  const lockKey = `resend:locked:${email}`;
  const sequenceKey = `resend:seq:${email}`;

  // 1. Check nếu bị khóa
  const isLocked = await redisClient.get(lockKey);
  if (isLocked) {
    const ttl = await redisClient.ttl(lockKey);
    return {
      allowed: false,
      isLocked: true,
      nextReset: ttl > 0 ? ttl : LOCKOUT_DURATION,
    };
  }

  // 2. Check số lần đã gửi
  const attemptStr = await redisClient.get(sequenceKey);
  const attempt = attemptStr ? Number(attemptStr) : 0;

  // Nếu đã gửi >= MAX_ATTEMPTS, lần tiếp theo sẽ bị khóa
  if (attempt >= MAX_ATTEMPTS) {
    return {
      allowed: true, // Cho phép lần cuối để trigger lockout
      attempt: attempt + 1, // 4 trở lên
    };
  }

  return {
    allowed: true,
    attempt: attempt + 1, // Lần tiếp theo (1, 2, 3)
  };
};

/**
 * Record an email resend attempt
 * If exceeded MAX_ATTEMPTS, lock the email for 24 hours
 */
export const recordEmailResend = async (email: string): Promise<void> => {
  const sequenceKey = `resend:seq:${email}`;
  const lockKey = `resend:locked:${email}`;

  const currentAttempt = await redisClient.incr(sequenceKey);

  // Nếu lần thứ nhất, set TTL 24h
  if (currentAttempt === 1) {
    await redisClient.expire(sequenceKey, LOCKOUT_DURATION);
  }

  // Nếu vượt quá MAX_ATTEMPTS, khóa ngay
  if (currentAttempt > MAX_ATTEMPTS) {
    await redisClient.setEx(lockKey, LOCKOUT_DURATION, "1");
    // Xóa sequence key để reset counters khi lockout hết
    await redisClient.del(sequenceKey);
  }
};

/**
 * Get the cooldown in seconds for the current attempt
 * Sequence: 0s (initial) -> 60s -> 300s (5min) -> 1800s (30min)
 */
export const getNextCooldown = (attempt: number): number => {
  // attempt = 1, 2, 3, 4+
  // cooldown = COOLDOWN_SEQUENCE[0], [1], [2], [3]
  return COOLDOWN_SEQUENCE[Math.min(attempt - 1, COOLDOWN_SEQUENCE.length - 1)];
};

/**
 * Get remaining cooldown seconds for an email (used for retry-after)
 */
export const getRemainingCooldown = async (
  email: string,
): Promise<number | null> => {
  const sequenceKey = `resend:seq:${email}`;
  const attemptStr = await redisClient.get(sequenceKey);
  const attempt = attemptStr ? Number(attemptStr) : 0;

  if (attempt === 0) {
    return null; // No cooldown yet
  }

  return getNextCooldown(attempt);
};

// Password Reset Rate Limiting (same pattern as email resend)

/**
 * Check if user can request password reset
 * Returns the current attempt number and whether it's allowed
 */
export const checkPasswordResetLimit = async (
  email: string,
): Promise<ResendLimitResult> => {
  const lockKey = `password-reset:locked:${email}`;
  const sequenceKey = `password-reset:seq:${email}`;

  // 1. Check nếu bị khóa
  const isLocked = await redisClient.get(lockKey);
  if (isLocked) {
    const ttl = await redisClient.ttl(lockKey);
    return {
      allowed: false,
      isLocked: true,
      nextReset: ttl > 0 ? ttl : LOCKOUT_DURATION,
    };
  }

  // 2. Check số lần đã gửi
  const attemptStr = await redisClient.get(sequenceKey);
  const attempt = attemptStr ? Number(attemptStr) : 0;

  // Nếu đã gửi >= MAX_ATTEMPTS, lần tiếp theo sẽ bị khóa
  if (attempt >= MAX_ATTEMPTS) {
    return {
      allowed: true,
      attempt: attempt + 1,
    };
  }

  return {
    allowed: true,
    attempt: attempt + 1,
  };
};

/**
 * Record a password reset attempt
 * If exceeded MAX_ATTEMPTS, lock the email for 24 hours
 */
export const recordPasswordResetAttempt = async (
  email: string,
): Promise<void> => {
  const sequenceKey = `password-reset:seq:${email}`;
  const lockKey = `password-reset:locked:${email}`;

  const currentAttempt = await redisClient.incr(sequenceKey);

  // Nếu lần thứ nhất, set TTL 24h
  if (currentAttempt === 1) {
    await redisClient.expire(sequenceKey, LOCKOUT_DURATION);
  }

  // Nếu vượt quá MAX_ATTEMPTS, khóa ngay
  if (currentAttempt > MAX_ATTEMPTS) {
    await redisClient.setEx(lockKey, LOCKOUT_DURATION, "1");
    await redisClient.del(sequenceKey);
  }
};
