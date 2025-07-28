import {
    OutputGroup,
    Output,
    
  } from "@aws-sdk/client-mediaconvert";
  import {MetaData} from "../convertProcessMetaData";
  import {Credential} from  "../typesOfObject";
export function buildDashOutputGroup(data : MetaData, credential : Credential): OutputGroup {
    const outputs: Output[] = [
      createDashOutput(1920, 1080, 5000000),
      createDashOutput(1280, 720, 3000000),
      createDashOutput(640, 360, 1000000),
      createDashOutput(426, 240, 500000),
    ];
  
    const dashSettings: any = {
      Destination: credential.OUTPUT_VIDEO,
    };
  
    if (data.options.drm) {
      dashSettings.Encryption = {
        SpekeKeyProvider: {
          Url: credential.SPEKE_URL,
          RoleArn: credential.ROLE_ARN,
          SystemIds: [
            "9a04f079-9840-4286-ab92-e65be0885f95", // PlayReady
            "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed", // Widevine
          ],
        },
      };
    }
    //dashSettings.ManifestName =   "index";
    return {
      Name: data.fileName as string,
      OutputGroupSettings: {
        Type: "DASH_ISO_GROUP_SETTINGS",
        DashIsoGroupSettings: dashSettings,
      },
      Outputs: outputs,
    };
  }
  function createDashOutput(width: number, height: number, bitrate: number): Output {
       const resolutionLabel = `${height}p`;
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
      NameModifier: `_video_${resolutionLabel}`   // this changes each segment's file name
    
    };
  }