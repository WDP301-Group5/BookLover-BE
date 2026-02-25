import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = (password: string): string => {
	const salt = bcrypt.genSaltSync(10);
	const hashedPassword = bcrypt.hashSync(password, salt);
	return hashedPassword;
};

export const comparePassword = (
	plainPassword: string,
	hashedPassword: string,
): boolean => {
	return bcrypt.compareSync(plainPassword, hashedPassword);
};

export const generateAccessToken = (payload: object): string => {
	const secret = process.env.JWT_ACCESS_SECRET || "access_secret";
	return jwt.sign(payload, secret, { expiresIn: "1h", algorithm: "HS256" });
};

export const generateRefreshToken = (
	payload: object,
	rememberMe: boolean = false,
): string => {
	const secret = process.env.JWT_REFRESH_SECRET || "refresh_secret";
	const expiresIn = rememberMe ? "30d" : "7d";
	return jwt.sign(payload, secret, {
		expiresIn,
		algorithm: "HS256",
	});
};
