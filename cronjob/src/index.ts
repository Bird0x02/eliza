import { JobQueue, JobWorker } from "@elizaos/adapter-bullmq"; // Đảm bảo rằng bạn có file JobWorker.ts
import { elizaLogger } from "@elizaos/core";
import dotenv from "dotenv";
import {fetchTopDexByNetwork} from "./services/fetchTopDex"
// import readGoogleSheet from "./services/syncFileExcelToPostgres"
dotenv.config();
const QUEUE_NAME = process.env.QUEUE_NAME || "cronjob";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const jobQueue = new JobQueue(QUEUE_NAME, REDIS_URL);

const scheduledJobs = [
    { jobName: "fetchSuiDex", data:{}, cron: "* * * * *" }, // run 5 min
    // { jobName: "syncFileExceltoPostgres", data:{}, cron: "* * * * *" }, // run 5 min
];
(async () => {
    for (const job of scheduledJobs) {
        await jobQueue.addJob(job.jobName, job.data, { repeat: { cron: job.cron } });
    }
})();
const worker = new JobWorker(QUEUE_NAME, REDIS_URL);

worker.registerJob("fetchSuiDex", fetchTopDexByNetwork);
// worker.registerJob("syncFileExceltoPostgres", readGoogleSheet);
elizaLogger.info("🚀 Worker & Scheduler running...");
