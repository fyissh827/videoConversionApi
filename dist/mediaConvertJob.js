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
const conversionJobHandler_1 = require("./conversionJobHandler");
const kafkaProducer_1 = require("./kafkaProducer");
// === Load ENV Variables ===
const REGION = process.env.REGION;
const INPUT_FILE = process.env.INPUT_FILE;
const OUTPUT_VIDEO = process.env.OUTPUT_VIDEO;
const OUTPUT_THUMBNAILS = process.env.OUTPUT_THUMBNAILS;
const OUTPUT_SUBTITLES = process.env.OUTPUT_SUBTITLES;
const ROLE_ARN = process.env.ROLE_ARN;
const SPEKE_URL = process.env.SPEKE_URL;
// === Feature toggles ===
const options = {
    drm: true,
    thumbnails: true,
    subtitles: true,
};
function startFlexibleMediaConvertJob(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const baseClient = new client_mediaconvert_1.MediaConvertClient({ region: REGION });
        const { Endpoints } = yield baseClient.send(new client_mediaconvert_1.DescribeEndpointsCommand({}));
        const endpoint = (_a = Endpoints === null || Endpoints === void 0 ? void 0 : Endpoints[0]) === null || _a === void 0 ? void 0 : _a.Url;
        if (!endpoint)
            throw new Error("Failed to retrieve MediaConvert endpoint.");
        const client = new client_mediaconvert_1.MediaConvertClient({ region: REGION, endpoint });
        const outputGroups = [];
        outputGroups.push(buildDashOutputGroup());
        if (options.thumbnails) {
            outputGroups.push(buildThumbnailsOutputGroup());
        }
        if (options.subtitles) {
            outputGroups.push(buildSubtitlesOutputGroup());
        }
        const input = {
            FileInput: INPUT_FILE,
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
            Role: ROLE_ARN,
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
// === DASH Output Group with optional DRM ===
function buildDashOutputGroup() {
    const outputs = [
        createDashOutput(1920, 1080, 5000000),
        createDashOutput(1280, 720, 3000000),
        createDashOutput(640, 360, 1000000),
        createDashOutput(426, 240, 500000),
    ];
    const dashSettings = {
        Destination: OUTPUT_VIDEO,
    };
    if (options.drm) {
        dashSettings.Encryption = {
            SpekeKeyProvider: {
                Url: SPEKE_URL,
                RoleArn: ROLE_ARN,
                SystemIds: [
                    "9a04f079-9840-4286-ab92-e65be0885f95", // PlayReady
                    "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed", // Widevine
                ],
            },
        };
    }
    return {
        Name: "DASH ISO",
        OutputGroupSettings: {
            Type: "DASH_ISO_GROUP_SETTINGS",
            DashIsoGroupSettings: dashSettings,
        },
        Outputs: outputs,
    };
}
function createDashOutput(width, height, bitrate) {
    return {
        ContainerSettings: {
            Container: "MPEG-DASH",
        },
        VideoDescription: {
            Width: width,
            Height: height,
            CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                    Bitrate: bitrate,
                    RateControlMode: "CBR",
                    CodecLevel: "AUTO",
                    CodecProfile: "MAIN",
                    MaxBitrate: bitrate,
                    GopSize: 2,
                    GopSizeUnits: "SECONDS",
                },
            },
        },
        AudioDescriptions: [
            {
                CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                        Bitrate: 96000,
                        CodingMode: "CODING_MODE_2_0",
                        SampleRate: 48000,
                    },
                },
                AudioSourceName: "Audio Selector 1",
            },
        ],
        NameModifier: `_${height}p`,
    };
}
// === Thumbnails Output Group ===
function buildThumbnailsOutputGroup() {
    return {
        Name: "Thumbnails",
        OutputGroupSettings: {
            Type: "FILE_GROUP_SETTINGS",
            FileGroupSettings: {
                Destination: OUTPUT_THUMBNAILS,
            },
        },
        Outputs: [
            {
                ContainerSettings: {
                    Container: "RAW",
                },
                VideoDescription: {
                    CodecSettings: {
                        Codec: "FRAME_CAPTURE",
                        FrameCaptureSettings: {
                            FramerateNumerator: 1,
                            FramerateDenominator: 5,
                            MaxCaptures: 10,
                        },
                    },
                },
                NameModifier: "_thumb",
            },
        ],
    };
}
// === Subtitles Output Group ===
function buildSubtitlesOutputGroup() {
    return {
        Name: "Subtitles Output",
        OutputGroupSettings: {
            Type: "FILE_GROUP_SETTINGS",
            FileGroupSettings: {
                Destination: OUTPUT_SUBTITLES,
            },
        },
        Outputs: [
            {
                ContainerSettings: {
                    Container: "RAW",
                },
                CaptionDescriptions: [
                    {
                        DestinationSettings: {
                            SrtDestinationSettings: {},
                        },
                        CaptionSelectorName: "Captions Selector 1",
                        LanguageCode: "eng",
                    },
                ],
                NameModifier: "_sub",
            },
        ],
    };
}
