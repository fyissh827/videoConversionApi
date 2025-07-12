// src/kafkaProducer.ts
import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

const kafka = new Kafka({
  clientId: "media-convert-result-producer",
  brokers: [process.env.KAFKA_BROKER!],
});

const producer = kafka.producer();

export async function connectKafkaProducer() {
  await producer.connect();
  console.log("Kafka producer connected");
}

export async function sendConversionResultMessage(message: object) {
  await producer.send({
    topic: process.env.KAFKA_RESULT_TOPIC!,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });

  console.log("Sent conversion result to Kafka:", message);
}