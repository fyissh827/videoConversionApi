"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.creteFolderForDash = creteFolderForDash;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const OUTPUT_VIDEO_URL = process.env.OUTPUT_VIDEO_URL; // e.g., "s3://my-bucket/videos/2025/"
// Converts an S3-style path into a local folder path
function getLocalPathFromS3(s3Url, folderName) {
    const match = s3Url.match(/^s3:\/\/[^\/]+\/(.+)$/);
    if (!match)
        throw new Error("Invalid S3 URL format");
    const relativePath = match[1];
    return path_1.default.resolve(__dirname, "output", relativePath, folderName);
}
// Checks if the folder exists
function folderExists(folderPath) {
    return new Promise((resolve) => {
        fs_1.default.access(folderPath, fs_1.default.constants.F_OK, (err) => {
            resolve(!err);
        });
    });
}
// Creates the folder
function createFolder(folderPath) {
    return new Promise((resolve, reject) => {
        fs_1.default.mkdir(folderPath, { recursive: true }, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
;
/**
* Ensures a folder exists. If not, it will be created.
* @param data - main metaData
* @returns Promise<void>
*/
function creteFolderForDash(data) {
    return new Promise((resolve, reject) => {
        const folderPath = getLocalPathFromS3(OUTPUT_VIDEO_URL, data.fileName);
        folderExists(folderPath)
            .then((exists) => {
            if (exists) {
                console.log(`Folder already exists at: ${folderPath}`);
                resolve();
            }
            else {
                return createFolder(folderPath)
                    .then(() => {
                    console.log(`Folder created at: ${folderPath}`);
                    resolve();
                })
                    .catch((err) => {
                    reject(`Error creating folder: ${err}`);
                });
            }
        })
            .catch((err) => {
            reject(`Error checking folder existence: ${err}`);
        });
    });
}
