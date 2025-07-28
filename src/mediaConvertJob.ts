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
import { buildDashOutputGroup } from "./conversionJobs/dashConversion";
import { buildThumbnailsOutputGroup } from "./conversionJobs/thumbnailConversion";
import {buildSubtitlesOutputGroup} from "./conversionJobs/subtitleConversion";
import {conversionJobHandler} from "./conversionJobHandler";
import { sendConversionResultMessage } from "./kafkaProducer";
import {Credential} from  "./typesOfObject";

const credential : Credential = {
   REGION : process.env.REGION!,
   INPUT_FILE : process.env.INPUT_FILE!,
   OUTPUT_VIDEO : process.env.OUTPUT_VIDEO!,
   OUTPUT_THUMBNAILS : process.env.OUTPUT_THUMBNAILS!,
   OUTPUT_SUBTITLES : process.env.OUTPUT_SUBTITLES!,
   ROLE_ARN : process.env.ROLE_ARN!,
   SPEKE_URL : process.env.SPEKE_URL!
};



// === Feature toggles ===
const options = {
  drm: true,
  thumbnails: true,
  subtitles: true,
};

export async function startFlexibleMediaConvertJob(data : MetaData): Promise<void> {
  const baseClient = new MediaConvertClient({ region: credential.REGION });
  const { Endpoints } = await baseClient.send(new DescribeEndpointsCommand({}));
  const endpoint = Endpoints?.[0]?.Url;

  if (!endpoint) throw new Error("Failed to retrieve MediaConvert endpoint.");

  const client = new MediaConvertClient({ region: credential.REGION, endpoint });

  const outputGroups: OutputGroup[] = [];
  outputGroups.push(buildDashOutputGroup(data, credential));

  if (options.thumbnails) {
    outputGroups.push(buildThumbnailsOutputGroup(data, credential));
  }

  if (options.subtitles) {
    outputGroups.push(buildSubtitlesOutputGroup(data, credential));
  }

  const input: any = {
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

  const jobSettings: CreateJobCommandInput = {
    Role: credential.ROLE_ARN,
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


