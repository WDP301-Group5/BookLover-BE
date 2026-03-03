export function sendVerificationEmail(
	email: string,
	name: string,
	token: string,
	frontendUrl: string,
): Promise<void>;

export function sendPaymentConfirmation(
	toEmail: string,
	order: unknown,
	payment: unknown,
): Promise<void>;

export function sendShippingStatusEmail(
	toEmail: string,
	shipping: unknown,
): Promise<void>;
