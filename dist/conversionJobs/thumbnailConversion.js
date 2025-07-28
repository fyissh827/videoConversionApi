"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildThumbnailsOutputGroup = buildThumbnailsOutputGroup;
function buildThumbnailsOutputGroup(data, credential) {
    return {
        Name: data.thumbnailsFileName,
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
