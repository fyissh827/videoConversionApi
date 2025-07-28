import {
    OutputGroup,
    Output,
    
  } from "@aws-sdk/client-mediaconvert";
  import {MetaData} from "../convertProcessMetaData";
  import {Credential} from  "../typesOfObject";
export function buildSubtitlesOutputGroup(data : MetaData, credential : Credential): OutputGroup {
    return {
      Name: data.subtitlesFileName as string,
      OutputGroupSettings: {
        Type: "FILE_GROUP_SETTINGS",
        FileGroupSettings: {
          Destination: credential.OUTPUT_SUBTITLES,
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