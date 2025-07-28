 interface Options  {
     drm : Boolean;
     thumbnails : Boolean;
     subtitles : Boolean;
 }
interface Data {
    name : String;
    jobId : String;
    options : Options; 
}
export interface MetaData {
    jobId : String;
    fileName : String;
   drmFileName : String;
   thumbnailsFileName : String;
   subtitlesFileName : String;
   options : Options; 
}
 export function Convert(data : Data) : MetaData{   
    return {
        jobId : data.jobId,
        fileName: data.name,
        drmFileName: data.name,
        thumbnailsFileName: data.name,
        subtitlesFileName: data.name,
        options: data.options
      };
 }
 