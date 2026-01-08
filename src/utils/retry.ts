/**
 * retry function with exponential backoff
 * fn must return a Promise
 */
export async function retry<T>(
	fn: () => Promise<T>,
	{
		retries = 3,
		baseDelayMs = 300,
	}: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
	let attempt = 0;
	while (true) {
		try {
			return await fn();
		} catch (err) {
			attempt++;
			if (attempt > retries) throw err;
			const delay = baseDelayMs * 2 ** (attempt - 1);
			await new Promise<void>((resolve) => setTimeout(resolve, delay));
		}
	}
}
