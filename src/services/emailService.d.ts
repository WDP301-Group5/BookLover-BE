export function sendPaymentConfirmation(
	toEmail: string,
	order: { _id: string },
	payment: { transactionId: string; amount: number },
): Promise<void>;

export function sendShippingStatusEmail(
	toEmail: string,
	shipping: { orderId: string; trackingNumber: string; status: string },
): Promise<void>;

export function sendVerificationEmail(
	toEmail: string,
	fullName: string,
	verificationToken: string,
	frontendUrl: string,
): Promise<void>;
