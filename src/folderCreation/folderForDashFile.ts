import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { MetaData} from "../convertProcessMetaData";
dotenv.config();

const OUTPUT_VIDEO_URL = process.env.OUTPUT_VIDEO_URL!; // e.g., "s3://my-bucket/videos/2025/"

// Converts an S3-style path into a local folder path
function getLocalPathFromS3(s3Url: string, folderName : String): string {
  const match = s3Url.match(/^s3:\/\/[^\/]+\/(.+)$/);
  if (!match) throw new Error("Invalid S3 URL format");
  const relativePath = match[1];
  return path.resolve(__dirname, "output", relativePath, <string>folderName);
}

// Checks if the folder exists
function folderExists(folderPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(folderPath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

// Creates the folder
function createFolder(folderPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

 /**
 * Ensures a folder exists. If not, it will be created.
 * @param data - main metaData
 * @returns Promise<void>
 */

export function creteFolderForDash(data : MetaData): Promise<void> {
  return new Promise((resolve, reject) => {
    const folderPath = getLocalPathFromS3(OUTPUT_VIDEO_URL, data.fileName);

    folderExists(folderPath)
      .then((exists) => {
        if (exists) {
          console.log(`Folder already exists at: ${folderPath}`);
          resolve();
        } else {
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

