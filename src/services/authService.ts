import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { UserAuth } from "../models/UserAuth.js";
import { comparePassword, generateAccessToken } from "../utils/hashPassword.js";
import type { LoginInput } from "../utils/validation.js";

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

export const loginUser = async (
  credentials: LoginInput,
): Promise<AuthResponse> => {
  const { email, password, captchaToken } = credentials;

  // Verify reCAPTCHA first
  await verifyCaptcha(captchaToken);

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
