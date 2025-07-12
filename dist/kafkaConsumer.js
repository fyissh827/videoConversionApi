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
exports.startKafkaConsumer = startKafkaConsumer;
const kafkajs_1 = require("kafkajs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisQueue_1 = require("./redisQueue");
const conversionJobHandler_1 = require("./conversionJobHandler");
const kafka = new kafkajs_1.Kafka({
    clientId: "media-convert-service",
    brokers: [process.env.KAFKA_BROKER],
});
const topic = process.env.KAFKA_TOPIC;
const consumer = kafka.consumer({ groupId: "media-convert-group" });
function startKafkaConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        yield consumer.connect();
        yield consumer.subscribe({ topic, fromBeginning: false });
        console.log(`Kafka: Listening to topic '${topic}'`);
        yield consumer.run({
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ message }) {
                var _b;
                try {
                    const value = (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString();
                    const job = JSON.parse(value);
                    yield (0, redisQueue_1.enqueueJob)(job);
                    yield conversionJobHandler_1.conversionJobHandler.getInstance().jobHandler();
                    console.log("MediaConvert job triggered.");
                }
                catch (err) {
                    console.error("Error processing Kafka message:", err);
                }
            }),
        });
    });
}
