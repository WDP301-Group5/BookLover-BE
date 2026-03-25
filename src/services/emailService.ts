import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

/**
 * Create Gmail OAuth2 email transporter.
 *
 * Required env vars: EMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 */
function createTransporter() {
	const user = process.env.EMAIL_USER;

	if (!user) {
		logger.warn("EMAIL_USER is not set. Email sending will fail at runtime.");
	}

	logger.info("Email transporter: using Gmail OAuth2");
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user,
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
		},
	});
}

const transporter = createTransporter();

export async function sendPaymentConfirmation(
	toEmail: string,
	order: any,
	payment: any,
) {
	const subject = `Payment confirmed for order ${order._id}`;
	const text = `Payment ${payment.transactionId} succeeded. Amount: ${payment.amount}. Order: ${order._id}`;
	try {
		await transporter.sendMail({
			from: `BookLover <${process.env.EMAIL_USER}>`,
			to: toEmail,
			subject,
			text,
		});
		logger.info("Payment confirmation email sent", {
			to: toEmail,
			orderId: order._id,
		});
	} catch (err) {
		logger.error("Failed to send payment confirmation", err);
	}
}

export async function sendShippingStatusEmail(toEmail: string, shipping: any) {
	const subject = `Shipping status update for order ${shipping.orderId}`;
	const text = `Tracking ${shipping.trackingNumber} - status: ${shipping.status}`;
	try {
		await transporter.sendMail({
			from: `BookLover <${process.env.EMAIL_USER}>`,
			to: toEmail,
			subject,
			text,
		});
		logger.info("Shipping status email sent", {
			to: toEmail,
			orderId: shipping.orderId,
			status: shipping.status,
		});
	} catch (err) {
		logger.error("Failed to send shipping status email", err);
	}
}

export async function sendVerificationEmail(
	email: string,
	name: string,
	token: string,
	frontendUrl: string,
) {
	const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
	const subject = "Verify your email address";
	const html = `
    <p>Hello ${name},</p>
    <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
    <a href="${verificationLink}">${verificationLink}</a>
    <p>This link will expire in 24 hours.</p>
    <p>Best regards,<br>BookLover Team</p>
  `;
	try {
		await transporter.sendMail({
			from: `BookLover <${process.env.EMAIL_USER}>`,
			to: email,
			subject,
			html,
		});
		logger.info("Verification email sent", {
			to: email,
			name,
		});
	} catch (err) {
		logger.error("Failed to send verification email", err);
		throw err;
	}
}

export async function sendPasswordResetEmail(
	email: string,
	name: string,
	token: string,
	frontendUrl: string,
) {
	const resetLink = `${frontendUrl}/reset-password?token=${token}`;
	const subject = "Reset your password";
	const html = `
    <p>Hello ${name},</p>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>This link will expire in 15 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br>BookLover Team</p>
  `;
	try {
		await transporter.sendMail({
			from: `BookLover <${process.env.EMAIL_USER}>`,
			to: email,
			subject,
			html,
		});
		logger.info("Password reset email sent", {
			to: email,
			name,
		});
	} catch (err) {
		logger.error("Failed to send password reset email", err);
		throw err;
	}
}
