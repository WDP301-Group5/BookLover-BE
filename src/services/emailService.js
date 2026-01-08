import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: Number(process.env.EMAIL_PORT || 587),
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export async function sendPaymentConfirmation(toEmail, order, payment) {
	const subject = `Payment confirmed for order ${order._id}`;
	const text = `Payment ${payment.transactionId} succeeded. Amount: ${payment.amount}. Order: ${order._id}`;
	try {
		await transporter.sendMail({
			from: process.env.EMAIL_USER,
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

export async function sendShippingStatusEmail(toEmail, shipping) {
	const subject = `Shipping status update for order ${shipping.orderId}`;
	const text = `Tracking ${shipping.trackingNumber} - status: ${shipping.status}`;
	try {
		await transporter.sendMail({
			from: process.env.EMAIL_USER,
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
