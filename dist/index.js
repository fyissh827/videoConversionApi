"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisClient_1 = __importDefault(require("./redisClient"));
const express_1 = __importDefault(require("express"));
const kafkaProducer_1 = require("./kafkaProducer");
const kafkaConsumer_1 = require("./kafkaConsumer");
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 9051;
// Express Middleware
app.use(express_1.default.json());
redisClient_1.default.getInstance();
// Health Check Route
app.get("/", (_req, res) => {
    res.send("MediaConvert Kafka-Redis Service is running.");
});
// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// --- Redis Setup ---
const redis = new ioredis_1.default({
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
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, kafkaProducer_1.connectKafkaProducer)();
        console.log("Kafka Producer Ready");
        yield (0, kafkaConsumer_1.startKafkaConsumer)();
        console.log("Kafka Consumer Listening");
    }
    catch (err) {
        console.error("Error starting services:", err);
    }
}))();
