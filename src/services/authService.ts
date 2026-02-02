import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { UserAuth } from "../models/UserAuth.js";
import {
	comparePassword,
	generateAccessToken,
	generateRefreshToken,
} from "../utils/hashPassword.js";
import type { LoginInput } from "../utils/validation.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthResponse {
	success: boolean;
	accessToken: string;
	refreshToken: string;
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

export const loginUser = async (
	credentials: LoginInput,
): Promise<AuthResponse> => {
	const { email, password } = credentials;

	// Find user auth by email
	const userAuth = await UserAuth.findOne({ email: email.toLowerCase() });
	if (!userAuth) {
		throw new Error("Invalid email or password");
	}

	// Check if password exists (not OAuth users)
	if (!userAuth.password) {
		throw new Error("This account uses OAuth login");
	}

	// Verify password
	const isPasswordValid = comparePassword(password, userAuth.password);
	if (!isPasswordValid) {
		throw new Error("Invalid email or password");
	}

	// Find user profile
	const user = await User.findById(userAuth.userId);
	if (!user) {
		throw new Error("User profile not found");
	}

	// Check if user is banned
	if (user.status === "banned") {
		throw new Error("Account has been banned");
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

	const accessToken = generateAccessToken(tokenPayload);
	const refreshToken = generateRefreshToken(
		tokenPayload,
		credentials.rememberMe || false,
	);

	return {
		success: true,
		accessToken,
		refreshToken,
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
			throw new Error("Invalid Google token");
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
					"This email is already registered with a password. Please use email/password login.",
				);
			}

			// Update provider user ID if changed
			if (userAuth.providerUserId !== googleId) {
				userAuth.providerUserId = googleId;
				await userAuth.save();
			}

			user = await User.findById(userAuth.userId);
			if (!user) {
				throw new Error("User profile not found");
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
			throw new Error("Account has been banned");
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

		const accessToken = generateAccessToken(tokenPayload);
		const refreshToken = generateRefreshToken(tokenPayload, rememberMe);

		return {
			success: true,
			accessToken,
			refreshToken,
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
		throw new Error("Google authentication failed");
	}
};
