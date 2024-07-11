import cron from 'node-cron';

/**
 * Schedules a cron job to run a task at a specified interval.
 *
 * @param {string} cronExpression - The cron expression that determines when the task will run.
 * @param {() => Promise<void>} task - The task to be executed when the cron job is triggered.
 */
export async function scheduleCronJob(
    cronExpression: string,
    task: () => Promise<void>
) {
    /**
     * Schedules the cron job using the provided cron expression.
     * When the cron job is triggered, it will execute the provided task.
     */
    cron.schedule(cronExpression, async () => {
        await task();
    });
}