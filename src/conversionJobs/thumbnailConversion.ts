import {
    OutputGroup,
    Output,
    
  } from "@aws-sdk/client-mediaconvert";
  import {MetaData} from "../convertProcessMetaData";
  import {Credential} from  "../typesOfObject";
export  function buildThumbnailsOutputGroup(data : MetaData, credential : Credential): OutputGroup {
    return {
      Name: data.thumbnailsFileName as string,
      OutputGroupSettings: {
        Type: "FILE_GROUP_SETTINGS",
        FileGroupSettings: {
          Destination: credential.OUTPUT_THUMBNAILS,
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