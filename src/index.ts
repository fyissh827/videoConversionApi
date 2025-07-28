import dotenv from "dotenv";
dotenv.config();
import RedisClient from "./redisClient";
import express, { Request, Response } from "express";
import { connectKafkaProducer } from "./kafkaProducer";
import { startKafkaConsumer } from "./kafkaConsumer";
import Redis from "ioredis";

const app = express();
const PORT = process.env.PORT || 9051;

// Express Middleware
app.use(express.json());
RedisClient.getInstance();
// Health Check Route
app.get("/", (_req: Request, res: Response) => {
  res.send("MediaConvert Kafka-Redis Service is running.");
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- Redis Setup ---
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// --- Start Kafka Producer & Consumer ---


//  hiii this is harshit rajput 
     
 //love to allllllllll.

(async () => {
  try {
    await connectKafkaProducer();
    console.log("Kafka Producer Ready");

    await startKafkaConsumer();
    console.log("Kafka Consumer Listening");
  } catch (err) {
    console.error("Error starting services:", err);
  }
})();
