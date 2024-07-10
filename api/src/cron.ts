import cron from "node-cron";

export async function scheduleCronJob(
    cronExpression: string,
    task: () => Promise<void>
) {
    cron.schedule(cronExpression, async () => {
        await task();
    });
}