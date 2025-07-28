import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();
import { enqueueJob } from "./redisQueue";

import {conversionJobHandler} from "./conversionJobHandler";

const kafka = new Kafka({
  clientId: "media-convert-service",
  brokers: [process.env.KAFKA_BROKER!],
});

const topic = process.env.KAFKA_TOPIC!;
const consumer = kafka.consumer({ groupId: "media-convert-group" });

export async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`Kafka: Listening to topic '${topic}'`);
//break it
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const value = message.value?.toString();
        const job = JSON.parse(value as any);
        await enqueueJob(job);
        await conversionJobHandler.getInstance().jobHandler();
        
      

        console.log("MediaConvert job triggered.");
      } catch (err) {
        console.error("Error processing Kafka message:", err);
      }
    },
  });
}
