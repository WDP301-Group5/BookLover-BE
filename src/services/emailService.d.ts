export function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  frontendUrl: string
): Promise<void>;

export function sendPaymentConfirmation(
  toEmail: string,
  order: any,
  payment: any
): Promise<void>;

export function sendShippingStatusEmail(
  toEmail: string,
  shipping: any
): Promise<void>;
