import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { UserAuth } from "../models/UserAuth.js";
import { comparePassword, generateAccessToken } from "../utils/hashPassword.js";
import type { LoginInput, RegisterInput } from "../utils/validation.js";
// @ts-ignore
import { sendVerificationEmail } from "./emailService.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthResponse {
  success: boolean;
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
  };
}

const verifyCaptcha = async (token: string): Promise<void> => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error("reCAPTCHA secret key is not configured");

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    { method: "POST" },
  );
  const data = (await response.json()) as {
    success: boolean;
    "error-codes"?: string[];
  };

  if (!data.success) {
    throw new Error("reCAPTCHA verification failed. Please try again.");
  }
};

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
  const { name, email, password, captchaToken } = data;

  // Verify reCAPTCHA
  await verifyCaptcha(captchaToken);

  const emailLower = email.toLowerCase();

  // Check if email already exists
  const existingAuth = await UserAuth.findOne({ email: emailLower });
  if (existingAuth) {
    throw new Error(
      "Email đã có sẵn trên hê thống. Vui lòng sử dụng email khác hoặc đăng nhập.",
    );
  }

  // Create User with inactive status (pending email verification)
  const user = await User.create({
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
 */
export const resendVerificationEmail = async (
  email: string,
  captchaToken: string,
): Promise<{ success: boolean; message: string }> => {
  // Verify reCAPTCHA
  await verifyCaptcha(captchaToken);

  const emailLower = email.toLowerCase();

  // Find auth record
  const userAuth = await UserAuth.findOne({ email: emailLower });
  if (!userAuth) {
    // Don't reveal whether the email exists
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi lại email xác thực.",
    };
  }

  // Find user profile
  const user = await User.findById(userAuth.userId);
  if (!user) {
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi lại email xác thực.",
    };
  }

  // Only resend for inactive (unverified) accounts
  if (user.status === "active") {
    throw new Error("Email này đã được xác thực. Vui lòng đăng nhập.");
  }

  if (user.status === "banned") {
    throw new Error("Tài khoản đã bị khóa.");
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken(
    user._id.toString(),
    emailLower,
  );

  // Send verification email
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  await sendVerificationEmail(
    emailLower,
    user.fullName,
    verificationToken,
    frontendUrl,
  );

  return {
    success: true,
    message:
      "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi lại email xác thực.",
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
    success: true,
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
        username: email.split("@")[0].toLowerCase(),
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
      success: true,
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
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Đăng nhập Google thất bại. Vui lòng thử lại.");
  }
};
