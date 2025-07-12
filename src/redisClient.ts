import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

class RedisClient {
  private static instance: Redis;

  private constructor() {} // Prevent instantiation

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      });

      RedisClient.instance.on("connect", () => {
        console.log("Redis connected");
      });

      RedisClient.instance.on("error", (err) => {
        console.error("Redis connection error:", err);
      });
    }

    return RedisClient.instance;
  }
}

export default RedisClient;