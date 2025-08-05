import { RedisClient } from 'bun';
import debug from 'debug';
import z from 'zod';

/**
 * A single message fetched from the task stream.
 * All fields are preserved in `fields` in case
 * the caller needs them for additional bookkeeping.
 */
export interface TaskMessage {
  /** Stream entry id (e.g. "1710513290554-0") */
  id: string;
  /** Full field map as stored in Redis */
  fields: Record<string, string>;
}

export interface WorkerOptions {
  /** Redis Stream key holding the tasks */
  streamKey: string;
  /** Consumer group name */
  group: string;
  /** Consumer name (usually hostname|pid) */
  consumer: string;
  /** A list key where failed tasks will be appended */
  deadLetterKey: string;
  /** How long a message may remain idle (ms) before we try to steal it */
  stealIdleMs?: number;
  /** Heartbeat interval while the handler is running (ms) */
  heartbeatIntervalMs?: number;
  /** How long to sleep when no work is found (ms) */
  idleSleepMs?: number;
  startFromBeginningOfQueue?: boolean;
}

const log = debug('mirvworld:matches:task-worker');

// ────────────────────────────────────────────────────────────────────────────────
// Zod helpers for RESP replies
// ────────────────────────────────────────────────────────────────────────────────

/** single entry: [ id, [ field, value, … ] ] */
const EntrySchema = z.tuple([z.string(), z.array(z.string())]);
/** RESP2: [ [ streamKey, [ entry, … ] ] ] */
const XReadArraySchema = z.tuple([z.tuple([z.string(), z.array(EntrySchema)])]);
/** RESP3: { streamKey: [ entry, … ] } */
const XReadMapSchema = z.record(z.string(), z.array(EntrySchema));
const XReadSchema = z.union([XReadArraySchema, XReadMapSchema]);

const XAutoClaimSchema = z.union([
  z.tuple([
    z.string(), // next‑cursor
    z.array(EntrySchema), // claimed
  ]),
  z.tuple([
    z.string(),
    z.array(EntrySchema),
    z.array(z.string()), // deleted ids
  ]),
]);

// ────────────────────────────────────────────────────────────────────────────────
// Worker class
// ────────────────────────────────────────────────────────────────────────────────

export class TaskWorker {
  private readonly redis: RedisClient;
  private readonly streamKey: string;
  private readonly group: string;
  private readonly consumer: string;
  private readonly deadLetterKey: string;
  private readonly stealIdleMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly idleSleepMs: number;
  private readonly startFromBeginingOfQueue: boolean;
  private stop = false;

  public constructor(redis: RedisClient, opts: WorkerOptions) {
    this.redis = redis;
    this.streamKey = opts.streamKey;
    this.group = opts.group;
    this.consumer = opts.consumer;
    this.deadLetterKey = opts.deadLetterKey;
    this.stealIdleMs = opts.stealIdleMs ?? 15_000;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs ?? 5_000;
    this.idleSleepMs = opts.idleSleepMs ?? 1_000;
    this.startFromBeginingOfQueue = opts.startFromBeginningOfQueue ?? false;
  }

  /**
   * Ensure the consumer group exists (idempotent).
   */
  public async ensureGroup(): Promise<void> {
    try {
      await this.redis.send('XGROUP', [
        'CREATE',
        this.streamKey,
        this.group,
        this.startFromBeginingOfQueue ? '0-0' : '$',
        'MKSTREAM',
      ]);
    } catch (err) {
      // BUSYGROUP → already exists, ignore
      if (!(err instanceof Error) || !err.message.includes('BUSYGROUP')) {
        throw err;
      }
    }
  }

  /**
   * Begin an infinite processing loop. The provided `listener` is invoked
   * whenever a task becomes available. While the listener runs, the worker
   * sends regular heartbeats to retain ownership. When the listener resolves
   * the task is acknowledged; when it rejects the task is moved to the
   * dead‑letter list. The loop then immediately continues with the next task.
   */
  public async process(listener: (task: TaskMessage) => Promise<void>): Promise<void> {
    await this.ensureGroup();

    while (!this.stop) {
      const task = await this.fetchNext();

      if (!task) {
        await Bun.sleep(this.idleSleepMs);
        continue;
      }

      let hb: number | undefined;
      try {
        // Start heartbeat ticker.
        hb = setInterval(() => {
          this.heartbeat(task.id).catch((err) => {
            log(`heartbeat failed for ${task.id}:`, err);
          });
        }, this.heartbeatIntervalMs) as unknown as number;

        await listener(task);
        await this.ack(task.id);
      } catch (err) {
        console.error(`[TaskWorker#${this.group}] listener rejected for ${task.id}`, err);
        await this.moveToDeadLetter(task, err instanceof Error ? err.message : String(err));
      } finally {
        if (hb !== undefined) clearInterval(hb);
      }
    }
  }

  /**
   * Atomically fetch a pending message that has been idle longer than
   * `stealIdleMs` (stealing) **or** the next new message. Returns `null` when
   * no work is available.
   */
  public async fetchNext(): Promise<TaskMessage | null> {
    // Try to steal a stuck message first (XAUTOCLAIM)
    const xacRaw = (await this.redis.send('XAUTOCLAIM', [
      this.streamKey,
      this.group,
      this.consumer,
      this.stealIdleMs.toString(),
      '0-0',
      'COUNT',
      '1',
    ])) as unknown;

    if (xacRaw !== null) {
      const xac = XAutoClaimSchema.safeParse(xacRaw);
      if (xac.success) {
        const [, entries] = xac.data;
        const entry = entries[0];
        if (entry) return this.parseEntry(entry);
      } else {
        console.warn(`[TaskWorker#${this.group}] XAUTOCLAIM parse error`, xac.error.format());
      }
    }

    // Read a fresh message (XREADGROUP)
    const xreadRaw = (await this.redis.send('XREADGROUP', [
      'GROUP',
      this.group,
      this.consumer,
      'COUNT',
      '1',
      'STREAMS',
      this.streamKey,
      '>',
    ])) as unknown;

    if (xreadRaw !== null) {
      const xread = XReadSchema.safeParse(xreadRaw);
      if (xread.success) {
        let entries: [string, string[]][] = [];
        if (Array.isArray(xread.data)) {
          // RESP2 → [[streamKey, entries]]
          entries = xread.data[0][1];
        } else {
          // RESP3 → {streamKey: entries}
          const firstKey = Object.keys(xread.data)[0]!;
          entries = xread.data[firstKey]!;
        }
        const entry = entries[0];
        if (entry) return this.parseEntry(entry);
      } else {
        console.warn(`[TaskWorker#${this.group}] XREADGROUP parse error`, xread.error.format());
      }
    }

    return null;
  }

  /**
   * Reset the message idle timer to keep the task assigned to this consumer.
   * Cheap no‑reply variant of XCLAIM.
   */
  public heartbeat(msgId: string): Promise<void> {
    return this.redis.send('XCLAIM', [this.streamKey, this.group, this.consumer, '0', msgId, 'JUSTID', 'IDLE', '0']);
  }

  /**
   * Acknowledge successful processing, removing the message from the PEL.
   */
  public ack(msgId: string): Promise<void> {
    log(`ack ${this.group} ${msgId}`);
    return this.redis.send('XACK', [this.streamKey, this.group, msgId]);
  }

  /**
   * Move a failed message to the dead‑letter list **and** acknowledge it so
   * that it does not get redelivered.
   */
  public async moveToDeadLetter(task: TaskMessage, reason?: string): Promise<void> {
    const deadRecord = JSON.stringify({
      ...task,
      reason,
      movedAt: Date.now(),
    });

    await this.redis.send('RPUSH', [this.deadLetterKey, deadRecord]);
    await this.ack(task.id);
  }

  public dispose() {
    this.stop = true;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  private parseEntry(entry: [string, string[]]): TaskMessage {
    const [msgId, rawFields] = entry;
    const fields = this.toObject(rawFields);

    return { id: msgId, fields };
  }

  private toObject(arr: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    for (let i = 0; i < arr.length; i += 2) {
      obj[arr[i]!] = arr[i + 1]!;
    }
    return obj;
  }
}
