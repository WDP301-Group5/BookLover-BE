import { createClient, type RedisClientType } from "redis";

const client: RedisClientType = createClient({
	socket: {
		host: process.env.REDIS_HOST ?? "localhost",
		port: Number(process.env.REDIS_PORT ?? 6379),
	},
});

console.log("Redis connecting...");

client.on("connect", () => console.log("✅✅✅✅✅ Redis connected"));
client.on("ready", () => console.log("Redis ready."));
client.on("error", (err) => console.log("❌❌❌❌❌ Redis error:", err));

async function initRedis(): Promise<void> {
	try {
		await client.connect();
	} catch (err: unknown) {
		if (err instanceof Error) {
			console.error("Redis Connect Error:", err.message);
		} else {
			console.error("Redis Connect Error:", err);
		}
	}
}

initRedis();

export default client;
