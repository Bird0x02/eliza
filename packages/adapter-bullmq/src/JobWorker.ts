import { Worker, Job } from "bullmq";
import { elizaLogger } from "@elizaos/core";
interface JobHandler {
  (job: Job): Promise<void>;
}

export class JobWorker {
  private worker: Worker;
  private handlers: Map<string, JobHandler>;

  constructor(queueName: string, redisUrl: string) {
    this.handlers = new Map();

    this.worker = new Worker(queueName, this.processJob.bind(this), {
      connection: { url: redisUrl },
      concurrency: 5,
    });

    this.worker.on("failed", (job, err) => {
        elizaLogger.info(`[Job Failed] ${job?.name}:`, err);
    });

    this.worker.on("completed", (job) => {
        elizaLogger.info(`[Job Completed] ${job?.name}`);
    });

    elizaLogger.info(`[Worker] Listening on queue: ${queueName}`);
  }

  public registerJob(jobName: string, handler: JobHandler) {
    this.handlers.set(jobName, handler);
  }

  private async processJob(job: Job) {
    const handler = this.handlers.get(job.name);
    if (!handler) {
        elizaLogger.info(`[Warning] No handler for job: ${job.name}`);
      return;
    }

    try {
      await handler(job);
    } catch (error) {
        elizaLogger.info(`[Error] Job ${job.name} failed:`, error);
      throw error;
    }
  }
}
