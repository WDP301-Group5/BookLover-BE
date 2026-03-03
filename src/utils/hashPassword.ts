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

export const generateAccessToken = (
	payload: object,
	rememberMe: boolean = false,
): string => {
	const secret = process.env.JWT_ACCESS_SECRET || "access_secret";
	const expiresIn = rememberMe ? "7d" : "1d";
	return jwt.sign(payload, secret, { expiresIn, algorithm: "HS256" });
};
