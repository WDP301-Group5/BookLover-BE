import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { UserAuth } from "../models/UserAuth.js";
import {
  comparePassword,
  generateAccessToken,
  generatePasswordResetToken,
} from "../utils/hashPassword.js";
import type {
  LoginInput,
  RegisterInput,
  PasswordResetConfirm,
} from "../utils/validation.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./emailService";
import {
  checkEmailResendLimit,
  recordEmailResend,
  getNextCooldown,
  checkPasswordResetLimit,
  recordPasswordResetAttempt,
} from "../utils/rateLimitEmail.js";
import createHttpError from "http-errors";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    status: string;
    avatarURL?: string;
    vipLevel: number;
    spiritStones: number;
  };
}

/**
 * Generate a JWT verification token for email verification.
 */
const generateVerificationToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET || "access_secret";
  return jwt.sign({ userId, email, purpose: "email-verification" }, secret, {
    expiresIn: "24h",
  });
};

export const registerUser = async (
  data: RegisterInput,
): Promise<{ success: boolean; message: string }> => {
  const { name, email, password } = data;

  const emailLower = email.toLowerCase();

  // Check if email already exists
  const existingAuth = await UserAuth.findOne({ email: emailLower });
  if (existingAuth) {
    throw createHttpError(
      409,
      "Email đã có sẵn trên hệ thống. Vui lòng sử dụng email khác hoặc đăng nhập.",
    );
  }

  // Create User with inactive status (pending email verification)
  const user = await User.create({
    username: emailLower.split("@")[0].toLowerCase(),
    fullName: name,
    email: emailLower,
    role: "user",
    status: "inactive",
    avatarURL: "",
    vipLevel: 0,
    spiritStones: 0,
    totalSpent: 0,
  });

  // Create UserAuth with local provider (password auto-hashed by pre-save hook)
  await UserAuth.create({
    userId: user._id,
    email: emailLower,
    provider: "local",
    password: password,
    username: emailLower.split("@")[0],
  });

  // Generate email verification token (24h expiry)
  const verificationToken = generateVerificationToken(
    user._id.toString(),
    emailLower,
  );

  // Send verification email — rollback if it fails
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    await sendVerificationEmail(
      emailLower,
      name,
      verificationToken,
      frontendUrl,
    );
  } catch {
    // Rollback: delete both records so user can try again
    await UserAuth.deleteOne({ userId: user._id });
    await User.findByIdAndDelete(user._id);
    throw new Error(
      "Không thể gửi email xác thực. Vui lòng kiểm tra lại địa chỉ email và thử đăng ký lại.",
    );
  }

  return {
    success: true,
    message:
      "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  };
};

export const verifyEmail = async (
  token: string,
): Promise<{ success: boolean; message: string }> => {
  const secret = process.env.JWT_ACCESS_SECRET || "access_secret";

  let decoded: { userId: string; email: string; purpose: string };
  try {
    decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      purpose: string;
    };
  } catch {
    throw new Error(
      "Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.",
    );
  }

  if (decoded.purpose !== "email-verification") {
    throw new Error("Token không hợp lệ.");
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  if (user.status === "active") {
    return {
      success: true,
      message:
        "Email đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.",
    };
  }

  user.status = "active";
  await user.save();

  return {
    success: true,
    message:
      "Email đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.",
  };
};

/**
 * Resend verification email for a user whose account is still inactive.
 * Uses progressive backoff: 60s -> 5min -> 30min, then 24h lockout
 */
export const resendVerificationEmail = async (
  email: string,
): Promise<{ success: boolean; message: string; nextResendIn?: number }> => {
  const emailLower = email.toLowerCase();

  // 1. Check rate limit
  const limitCheck = await checkEmailResendLimit(emailLower);

  if (!limitCheck.allowed) {
    if (limitCheck.isLocked) {
      const hours = Math.ceil(limitCheck.nextReset! / 3600);
      throw createHttpError(
        429,
        `Bạn đã yêu cầu gửi lại quá nhiều lần. Vui lòng thử lại sau ${hours} giờ.`,
      );
    }
  }

  // Nếu attempt > MAX_ATTEMPTS (attempt = 4 trở lên)
  if (limitCheck.attempt && limitCheck.attempt > 3) {
    throw createHttpError(
      429,
      "Bạn đã đạt giới hạn gửi lại. Chức năng sẽ bị khóa trong 24 giờ.",
    );
  }

  // 2. Find auth record
  const userAuth = await UserAuth.findOne({ email: emailLower });
  if (!userAuth) {
    // Don't reveal whether the email exists, but still record attempt
    await recordEmailResend(emailLower);
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi lại email xác thực.",
      nextResendIn: getNextCooldown(limitCheck.attempt || 1),
    };
  }

  // 3. Find user profile
  const user = await User.findById(userAuth.userId);
  if (!user) {
    // Record attempt even if user not found
    await recordEmailResend(emailLower);
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi lại email xác thực.",
      nextResendIn: getNextCooldown(limitCheck.attempt || 1),
    };
  }

  // 4. Only resend for inactive (unverified) accounts
  if (user.status === "active") {
    throw new Error("Email này đã được xác thực. Vui lòng đăng nhập.");
  }

  if (user.status === "banned") {
    throw new Error("Tài khoản đã bị khóa.");
  }

  // 5. Generate new verification token
  const verificationToken = generateVerificationToken(
    user._id.toString(),
    emailLower,
  );

  // 6. Send verification email
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  await sendVerificationEmail(
    emailLower,
    user.fullName,
    verificationToken,
    frontendUrl,
  );

  // 7. Record the resend attempt in Redis
  await recordEmailResend(emailLower);

  const nextCooldown = getNextCooldown(limitCheck.attempt || 1);

  return {
    success: true,
    message: "Email xác thực đã được gửi. Vui lòng kiểm tra email của bạn.",
    nextResendIn: nextCooldown,
  };
};

export const loginUser = async (
  credentials: LoginInput,
): Promise<AuthResponse> => {
  const { email, password } = credentials;

  // Find user auth by email
  const userAuth = await UserAuth.findOne({ email: email.toLowerCase() });
  if (!userAuth) {
    throw new Error("Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại");
  }

  // Check if password exists (not OAuth users)
  if (!userAuth.password) {
    throw new Error(
      "Tài khoản này sử dụng đăng nhập Google. Vui lòng đăng nhập bằng Google.",
    );
  }

  // Verify password
  const isPasswordValid = comparePassword(password, userAuth.password);
  if (!isPasswordValid) {
    throw new Error("Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại");
  }

  // Find user profile
  const user = await User.findById(userAuth.userId);
  if (!user) {
    throw new Error("Hồ sơ người dùng không tồn tại.");
  }

  // Check if user email is verified
  if (user.status === "inactive") {
    throw new Error(
      "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.",
    );
  }

  // Check if user is banned
  if (user.status === "banned") {
    throw new Error("Tài khoản đã bị khóa.");
  }

  // Update last login
  userAuth.lastLoginAt = new Date();
  await userAuth.save();

  // Generate tokens
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(
    tokenPayload,
    credentials.rememberMe || false,
  );

  return {
    accessToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      username: userAuth.username || "",
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarURL: user.avatarURL,
      vipLevel: user.vipLevel || 0,
      spiritStones: user.spiritStones || 0,
    },
  };
};

export const googleLogin = async (
  googleToken: string,
  rememberMe: boolean = false,
): Promise<AuthResponse> => {
  try {
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Không thể xác thực với Google. Vui lòng thử lại.");
    }

    const { email, name, sub: googleId, picture } = payload;
    const emailLower = email.toLowerCase();

    // Check if user already exists
    let userAuth = await UserAuth.findOne({ email: emailLower });
    let user: typeof User.prototype | null;

    if (userAuth) {
      // Existing user - check if it's a Google account
      if (userAuth.provider === "local") {
        throw new Error(
          "Email này đã được đăng ký với mật khẩu. Vui lòng đăng nhập bằng email/mật khẩu hoặc đặt lại mật khẩu nếu bạn quên.",
        );
      }

      // Update provider user ID if changed
      if (userAuth.providerUserId !== googleId) {
        userAuth.providerUserId = googleId;
        await userAuth.save();
      }

      user = await User.findById(userAuth.userId);
      if (!user) {
        throw new Error("Hồ sơ người dùng không tồn tại.");
      }
    } else {
      // New user - create both User and UserAuth
      user = await User.create({
        username: emailLower.split("@")[0].toLowerCase(),
        fullName: name || email.split("@")[0],
        email: emailLower,
        role: "user",
        status: "active",
        avatarURL: picture || "",
        vipLevel: 0,
        spiritStones: 0,
        totalSpent: 0,
      });

      userAuth = await UserAuth.create({
        userId: user._id,
        email: emailLower,
        provider: "google",
        providerUserId: googleId,
        username: emailLower.split("@")[0].toLowerCase(),
      });
    }

    // Check if user is banned
    if (user.status === "banned") {
      throw new Error("Tài khoản đã bị khóa.");
    }

    // Update last login
    userAuth.lastLoginAt = new Date();
    await userAuth.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload, rememberMe);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: userAuth.username || "",
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        avatarURL: user.avatarURL,
        vipLevel: user.vipLevel || 0,
        spiritStones: user.spiritStones || 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Đăng nhập Google thất bại. Vui lòng thử lại.");
  }
};

/**
 * Request password reset for an email address
 * Sends a password reset link via email with rate limiting
 */
export const requestPasswordReset = async (
  email: string,
): Promise<{ success: boolean; message: string; nextResendIn?: number }> => {
  const emailLower = email.toLowerCase();

  // 1. Check rate limit
  const limitCheck = await checkPasswordResetLimit(emailLower);

  if (!limitCheck.allowed) {
    if (limitCheck.isLocked) {
      const hours = Math.ceil(limitCheck.nextReset! / 3600);
      throw createHttpError(
        429,
        `Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau ${hours} giờ.`,
      );
    }
  }

  // If attempt > MAX_ATTEMPTS (attempt = 4 or more)
  if (limitCheck.attempt && limitCheck.attempt > 3) {
    throw createHttpError(
      429,
      "Bạn đã đạt giới hạn yêu cầu. Chức năng sẽ bị khóa trong 24 giờ.",
    );
  }

  // 2. Find user auth
  const userAuth = await UserAuth.findOne({ email: emailLower });

  // 3. Always return success message (don't reveal if email exists for security)
  const nextCooldown = getNextCooldown(limitCheck.attempt || 1);

  if (!userAuth) {
    // Record attempt even if email doesn't exist
    await recordPasswordResetAttempt(emailLower);
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết để đặt lại mật khẩu.",
      nextResendIn: nextCooldown,
    };
  }

  // 4. Find user profile
  const user = await User.findById(userAuth.userId);
  if (!user) {
    // Record attempt
    await recordPasswordResetAttempt(emailLower);
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết để đặt lại mật khẩu.",
      nextResendIn: nextCooldown,
    };
  }

  // 5. Check if account is local (not OAuth)
  if (userAuth.provider !== "local") {
    // Record attempt but don't send email
    await recordPasswordResetAttempt(emailLower);
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết để đặt lại mật khẩu.",
      nextResendIn: nextCooldown,
    };
  }

  // 6. Check if user is banned
  if (user.status === "banned") {
    // Record attempt but don't send email
    await recordPasswordResetAttempt(emailLower);
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết để đặt lại mật khẩu.",
      nextResendIn: nextCooldown,
    };
  }

  // 7. Generate password reset token (15 min expiry)
  const resetToken = generatePasswordResetToken(
    user._id.toString(),
    emailLower,
  );

  // 8. Send password reset email
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    await sendPasswordResetEmail(
      emailLower,
      user.fullName,
      resetToken,
      frontendUrl,
    );
  } catch (error) {
    // Don't record attempt if email send failed
    throw createHttpError(
      500,
      "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.",
    );
  }

  // 9. Record the password reset attempt
  await recordPasswordResetAttempt(emailLower);

  return {
    success: true,
    message:
      "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết để đặt lại mật khẩu.",
    nextResendIn: nextCooldown,
  };
};

/**
 * Confirm password reset with token and new password
 * Verifies the password reset token and updates the user's password
 */
export const confirmPasswordReset = async (
  data: PasswordResetConfirm,
): Promise<{ success: boolean; message: string }> => {
  const { token, newPassword } = data;
  const secret = process.env.JWT_ACCESS_SECRET || "access_secret";

  // 1. Verify token
  let decoded: { userId: string; email: string; purpose: string };
  try {
    decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      purpose: string;
    };
  } catch {
    throw new Error(
      "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.",
    );
  }

  // 2. Check token purpose
  if (decoded.purpose !== "password-reset") {
    throw new Error("Token không hợp lệ.");
  }

  // 3. Find userAuth
  const userAuth = await UserAuth.findOne({ email: decoded.email });
  if (!userAuth) {
    throw new Error("Người dùng không tồn tại.");
  }

  // 4. Verify user ID matches (extra security check)
  if (userAuth.userId.toString() !== decoded.userId) {
    throw new Error("Token không hợp lệ.");
  }

  // 5. Update password (pre-save hook will hash it)
  userAuth.password = newPassword;
  await userAuth.save();

  return {
    success: true,
    message: "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.",
  };
};
