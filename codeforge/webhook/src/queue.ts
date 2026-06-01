import { Queue } from "bullmq";
import { config } from "dotenv";

config();

const analyzePrQueue = new Queue("analyze-pr", {
  connection: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
});

export interface PrJobPayload {
  prNumber: number;
  repoFullName: string;
  headSha: string;
  baseBranch: string;
  title: string;
  author: string;
  installationId: number;
}

export async function enqueueAnalysis(payload: PrJobPayload): Promise<void> {
  await analyzePrQueue.add("analyze-pr", payload);
}
