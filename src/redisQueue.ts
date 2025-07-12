import dotenv from "dotenv";
dotenv.config();
import RedisClient from "./redisClient";
const redis = RedisClient.getInstance();

const QUEUE_KEY = process.env.REDIS_QUEUE_KEY!;

export async function enqueueJob(jobData: object) {
  await redis.rpush(QUEUE_KEY, JSON.stringify(jobData));
}

export async function dequeueJob(): Promise<any | null> {
  const raw = await redis.lpop(QUEUE_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function peekFirstJob(): Promise<any | null> {
    const raw = await redis.lindex(QUEUE_KEY, 0);
    return raw ? JSON.parse(raw) : null;
  }