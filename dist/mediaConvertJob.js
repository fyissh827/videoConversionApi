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
exports.startFlexibleMediaConvertJob = startFlexibleMediaConvertJob;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_mediaconvert_1 = require("@aws-sdk/client-mediaconvert");
const redisQueue_1 = require("./redisQueue");
const dashConversion_1 = require("./conversionJobs/dashConversion");
const thumbnailConversion_1 = require("./conversionJobs/thumbnailConversion");
const subtitleConversion_1 = require("./conversionJobs/subtitleConversion");
const conversionJobHandler_1 = require("./conversionJobHandler");
const kafkaProducer_1 = require("./kafkaProducer");
const credential = {
    REGION: process.env.REGION,
    INPUT_FILE: process.env.INPUT_FILE,
    OUTPUT_VIDEO: process.env.OUTPUT_VIDEO,
    OUTPUT_THUMBNAILS: process.env.OUTPUT_THUMBNAILS,
    OUTPUT_SUBTITLES: process.env.OUTPUT_SUBTITLES,
    ROLE_ARN: process.env.ROLE_ARN,
    SPEKE_URL: process.env.SPEKE_URL
};
// === Feature toggles ===
const options = {
    drm: true,
    thumbnails: true,
    subtitles: true,
};
function startFlexibleMediaConvertJob(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const baseClient = new client_mediaconvert_1.MediaConvertClient({ region: credential.REGION });
        const { Endpoints } = yield baseClient.send(new client_mediaconvert_1.DescribeEndpointsCommand({}));
        const endpoint = (_a = Endpoints === null || Endpoints === void 0 ? void 0 : Endpoints[0]) === null || _a === void 0 ? void 0 : _a.Url;
        if (!endpoint)
            throw new Error("Failed to retrieve MediaConvert endpoint.");
        const client = new client_mediaconvert_1.MediaConvertClient({ region: credential.REGION, endpoint });
        const outputGroups = [];
        outputGroups.push((0, dashConversion_1.buildDashOutputGroup)(data, credential));
        if (options.thumbnails) {
            outputGroups.push((0, thumbnailConversion_1.buildThumbnailsOutputGroup)(data, credential));
        }
        if (options.subtitles) {
            outputGroups.push((0, subtitleConversion_1.buildSubtitlesOutputGroup)(data, credential));
        }
        const input = {
            FileInput: credential.INPUT_FILE,
            AudioSelectors: {
                "Audio Selector 1": { DefaultSelection: "DEFAULT" },
            },
            VideoSelector: {},
            TimecodeSource: "ZERO",
        };
        if (options.subtitles) {
            input.CaptionSelectors = {
                "Captions Selector 1": {
                    SourceSettings: {
                        SourceType: "EMBEDDED",
                    },
                },
            };
        }
        const jobSettings = {
            Role: credential.ROLE_ARN,
            Settings: {
                OutputGroups: outputGroups,
                Inputs: [input],
            },
        };
        try {
            const command = new client_mediaconvert_1.CreateJobCommand(jobSettings);
            const response = yield client.send(command);
            console.log("MediaConvert job started:", (_b = response.Job) === null || _b === void 0 ? void 0 : _b.Id);
            // handle on pass to kafka producer to send data and apply request for nest;
            const f = (0, redisQueue_1.dequeueJob)();
            conversionJobHandler_1.conversionJobHandler.getInstance().setProcess(false);
            if (f != null) {
                yield conversionJobHandler_1.conversionJobHandler.getInstance().jobHandler();
            }
            (0, kafkaProducer_1.sendConversionResultMessage)(options);
        }
        catch (err) {
            console.error("MediaConvert job failed:", err);
        }
    });
}
