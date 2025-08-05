import { MinioPutEventSchema, type TaskMessage, TaskWorker } from 'utils';
import { RedisClient } from 'bun';
import type { MatchesService } from '../Services/MatchesService.ts';

export class MatchInfoImporter {
  private readonly worker: TaskWorker;

  public constructor(
    streamKey: string,
    redis: RedisClient,
    private readonly matches: MatchesService,
  ) {
    this.worker = new TaskWorker(redis, {
      consumer: `matches-processor-${process.pid}`,
      group: 'MatchInfoImporter',
      deadLetterKey: 'matches:deadletter',
      streamKey: streamKey,
    });

    this.worker.process(this.process);
  }

  public dispose() {
    this.worker.dispose();
  }

  private process = async (task: TaskMessage) => {
    const taskId = task.id;
    console.log(`[${this.constructor.name}][${taskId}] Processing task`);
    const tasks = MinioPutEventSchema.parse(JSON.parse(task.fields.data ?? '{}'));

    for (const task of tasks) {
      for (const event of task.Event) {
        if (event.eventName !== 's3:ObjectCreated:Put') {
          console.error(`[${this.constructor.name}][${taskId}] Unknown S3 event ${event.eventName}`);
          continue;
        }

        const filename = decodeURIComponent(event.s3.object.key);
        await this.matches.importFromReplay(filename);
        console.log(`[${this.constructor.name}][${taskId}] Imported ${filename}`);
      }
    }
  };
}
