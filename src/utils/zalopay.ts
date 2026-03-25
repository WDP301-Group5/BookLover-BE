import crypto from "crypto";

const APP_ID = process.env.ZALOPAY_APP_ID || "";
const KEY1 = process.env.ZALOPAY_KEY1 || "";
const _KEY2 = process.env.ZALOPAY_KEY2 || "";
const _ZALOPAY_ENDPOINT =
	process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create";
const RETURN_URL =
	process.env.ZALOPAY_RETURN_URL ||
	"http://localhost:9999/api/v1/order/zalopay/return";
const CALLBACK_URL =
	process.env.ZALOPAY_CALLBACK_URL || "http://localhost:9999/order/callback";
const RSA_PUBLIC_KEY = process.env.ZALOPAY_RSA_PUBLIC_KEY || "";

export const hmacSha256Hex = (key: string, str: string) =>
	crypto.createHmac("sha256", key).update(str).digest("hex");

export const buildAppTransId = (): string => {
	const now = new Date();
	const app_time = now.getTime();
	const yy = String(now.getFullYear()).slice(-2);
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	return `${yy}${mm}${dd}_${app_time}`;
};

export const buildOrderPayload = (
	amount: number,
	description: string,
	items = [],
	app_user = "booklover_user",
) => {
	// Embed redirect URL here (ZaloPay expects this inside embed_data)
	const embed_data = JSON.stringify({
		redirecturl: RETURN_URL, // correct placement
	});
	const app_time = Date.now();
	const app_trans_id = buildAppTransId();

	const item = JSON.stringify(items || []);
	const raw = `${APP_ID}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${item}`;
	const mac = hmacSha256Hex(KEY1, raw);

	return {
		app_id: Number(APP_ID),
		app_trans_id,
		app_user,
		app_time,
		amount,
		embed_data,
		item,
		description,
		mac,
		callback_url: CALLBACK_URL,
	};
};

export const createOrderCode = () => {
	const timestamp = Date.now().toString(); // Current timestamp in milliseconds
	const random = Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
	return `ORDER${timestamp}${random}`;
};

export const getMacVeryfy = (
	amount: number,
	reciever_info: string,
	time: number,
) => {
	const macInput =
		Number(APP_ID) +
		"|" +
		"WALLET" +
		"|" +
		reciever_info +
		"|" +
		String(amount) +
		"|" +
		String(time);
	const mac = hmacSha256Hex(KEY1, macInput);
	return mac;
};

export const encryptReceiverInfo = (data: object) => {
	try {
		const formattedKey = RSA_PUBLIC_KEY.includes("\\n")
			? RSA_PUBLIC_KEY.replace(/\\n/g, "\n")
			: RSA_PUBLIC_KEY;

		// Convert object -> JSON
		const stringData = JSON.stringify(data);

		// Encrypt bằng RSA PKCS1 (giống node-rsa)
		const encrypted = crypto.publicEncrypt(
			{
				key: formattedKey,
				padding: crypto.constants.RSA_PKCS1_PADDING,
			},
			stringData,
		);

		return encrypted.toString("base64");
	} catch (err) {
		console.error("Encrypt error:", err);
		throw err;
	}
};
