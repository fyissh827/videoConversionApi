import dotenv from "dotenv";
dotenv.config();
import {MetaData} from "./convertProcessMetaData";
import {
  MediaConvertClient,
  DescribeEndpointsCommand,
  CreateJobCommand,
  CreateJobCommandInput,
  OutputGroup,
  Output,
  
} from "@aws-sdk/client-mediaconvert";
import { dequeueJob } from "./redisQueue";
import {conversionJobHandler} from "./conversionJobHandler";
import { sendConversionResultMessage } from "./kafkaProducer";

// === Load ENV Variables ===
const REGION = process.env.REGION!;
const INPUT_FILE = process.env.INPUT_FILE!;
const OUTPUT_VIDEO = process.env.OUTPUT_VIDEO!;
const OUTPUT_THUMBNAILS = process.env.OUTPUT_THUMBNAILS!;
const OUTPUT_SUBTITLES = process.env.OUTPUT_SUBTITLES!;
const ROLE_ARN = process.env.ROLE_ARN!;
const SPEKE_URL = process.env.SPEKE_URL!;

// === Feature toggles ===
const options = {
  drm: true,
  thumbnails: true,
  subtitles: true,
};

export async function startFlexibleMediaConvertJob(data : MetaData): Promise<void> {
  const baseClient = new MediaConvertClient({ region: REGION });
  const { Endpoints } = await baseClient.send(new DescribeEndpointsCommand({}));
  const endpoint = Endpoints?.[0]?.Url;

  if (!endpoint) throw new Error("Failed to retrieve MediaConvert endpoint.");

  const client = new MediaConvertClient({ region: REGION, endpoint });

  const outputGroups: OutputGroup[] = [];
  outputGroups.push(buildDashOutputGroup());

  if (options.thumbnails) {
    outputGroups.push(buildThumbnailsOutputGroup());
  }

  if (options.subtitles) {
    outputGroups.push(buildSubtitlesOutputGroup());
  }

  const input: any = {
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

  const jobSettings: CreateJobCommandInput = {
    Role: ROLE_ARN,
    Settings: {
      OutputGroups: outputGroups,
      Inputs: [input],
    },
  };

  try {
    const command = new CreateJobCommand(jobSettings);
    const response = await client.send(command);
    console.log("MediaConvert job started:", response.Job?.Id);
   // handle on pass to kafka producer to send data and apply request for nest;
    
   const f = dequeueJob();
   conversionJobHandler.getInstance().setProcess(false);
    if(f != null){    
      await conversionJobHandler.getInstance().jobHandler();
    } 
    sendConversionResultMessage(options);

  } catch (err) {
    console.error("MediaConvert job failed:", err);
  }
}

// === DASH Output Group with optional DRM ===
function buildDashOutputGroup(): OutputGroup {
  const outputs: Output[] = [
    createDashOutput(1920, 1080, 5000000),
    createDashOutput(1280, 720, 3000000),
    createDashOutput(640, 360, 1000000),
    createDashOutput(426, 240, 500000),
  ];

  const dashSettings: any = {
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

function createDashOutput(width: number, height: number, bitrate: number): Output {
  return {
    ContainerSettings: {
      Container: "MPEG-DASH" as any,
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
function buildThumbnailsOutputGroup(): OutputGroup {
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
function buildSubtitlesOutputGroup(): OutputGroup {
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
            LanguageCode: "eng" as any,
          },
        ],
        NameModifier: "_sub",
      },
    ],
  };
}
