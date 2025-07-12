"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RedisClient {
    constructor() { } // Prevent instantiation
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new ioredis_1.default({
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
exports.default = RedisClient;
