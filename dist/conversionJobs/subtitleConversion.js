"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSubtitlesOutputGroup = buildSubtitlesOutputGroup;
function buildSubtitlesOutputGroup(data, credential) {
    return {
        Name: data.subtitlesFileName,
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
                        LanguageCode: "eng",
                    },
                ],
                NameModifier: "_sub",
            },
        ],
    };
}
