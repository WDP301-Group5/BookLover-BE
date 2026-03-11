import { createClient, type RedisClientType } from "redis";
import { DOTENV } from "../consts/dotenv";

const client: RedisClientType = createClient({
  socket: {
    host: DOTENV.REDIS_HOST,
    port: DOTENV.REDIS_PORT,
  },
  username: DOTENV.REDIS_USERNAME,
  password: DOTENV.REDIS_PASSWORD,
});

console.log("Redis connecting...");

client.on("ready", () => console.log("Redis ready."));
client.on("error", (err) => console.log("Redis error:", err));

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
