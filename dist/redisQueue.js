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
exports.enqueueJob = enqueueJob;
exports.dequeueJob = dequeueJob;
exports.peekFirstJob = peekFirstJob;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisClient_1 = __importDefault(require("./redisClient"));
const redis = redisClient_1.default.getInstance();
const QUEUE_KEY = process.env.REDIS_QUEUE_KEY;
function enqueueJob(jobData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield redis.rpush(QUEUE_KEY, JSON.stringify(jobData));
    });
}
function dequeueJob() {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield redis.lpop(QUEUE_KEY);
        return raw ? JSON.parse(raw) : null;
    });
}
function peekFirstJob() {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield redis.lindex(QUEUE_KEY, 0);
        return raw ? JSON.parse(raw) : null;
    });
}
