"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Convert = Convert;
function Convert(data) {
    return {
        fileName: data.name,
        drmFileName: data.name,
        thumbnailsFileName: data.name,
        subtitlesFileName: data.name,
        options: data.options
    };
}
