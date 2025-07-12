import { peekFirstJob } from "./redisQueue";
import {Convert, MetaData} from "./convertProcessMetaData";
import {startFlexibleMediaConvertJob} from "./mediaConvertJob";
export class conversionJobHandler {
  private static instance: conversionJobHandler;
   private  process : Boolean = false;
   
  // Private constructor prevents direct instantiation
  private constructor() {
   
  }

  // Static method to get the singleton instance
  public static getInstance(): conversionJobHandler {
    if (!conversionJobHandler.instance) {
        conversionJobHandler.instance = new conversionJobHandler();
    }
    return conversionJobHandler.instance;
  }
  public async jobHandler() : Promise<void>{
   if(this.process === false){
   const  obj = await  peekFirstJob();
   if(obj){
    // set new process   
     const data   = Convert(obj) as MetaData;
     await startFlexibleMediaConvertJob(data);
   }
   }
  }

  // Example method
  public getProcess(): Boolean {
    return this.process;
  }
  public setProcess(data: Boolean): void{
    this.process = data;
  }
}