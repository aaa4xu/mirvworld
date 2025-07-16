import { Game } from './Game.ts';
import { ReplayStorage } from './ReplayStorage.ts';
import { GameState } from './GameState.ts';
import type { Queue } from './Queue.ts';
import { GameId } from './OpenFront/GameId.ts';
import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';

export class Worker {
  private readonly consumerId = `w:${process.pid}`;
  private readonly active = new Map<string, AbortController>(); // msgId -> abortCtrl
  private hbTimer: ReturnType<typeof setInterval> | null = null;
  private stopping = false;

  public constructor(
    private readonly queue: Queue,
    private readonly storage: ReplayStorage,
    private readonly gameStream: GameState,
    private readonly server: OpenFrontServerAPI,
    private readonly groupName = 'lurker-workers',
    private readonly maxTasks = 50,
    private readonly heartbeatMs = 3_000,
  ) {}

  public async start(): Promise<void> {
    await this.queue.ensureGroup(this.groupName);
    this.scheduleHeartbeat();

    while (!this.stopping) {
      // limit parallelism
      if (this.active.size >= this.maxTasks) {
        await Bun.sleep(250);
        continue;
      }

      const msg = await this.queue.fetch(this.groupName, this.consumerId);
      if (!msg) {
        await Bun.sleep(250);
        continue;
      }

      // spin off the task
      this.handleMessage(msg.id, msg.fields).catch(console.error);
    }
  }

  /* graceful shutdown -------------------------------------------------- */
  public dispose() {
    if (this.stopping) return;
    this.stopping = true;

    if (this.hbTimer !== null) clearInterval(this.hbTimer);

    // abort all in-flight games
    for (const ctrl of this.active.values()) ctrl.abort();
  }

  /* main per-message logic -------------------------------------------- */
  private async handleMessage(msgId: string, fields: Record<string, string>) {
    const gameId = new GameId(fields.id!);
    const startAt = parseInt(fields.startAt!, 10);
    const game = new Game(gameId, startAt, this.server);
    const ctrl = new AbortController();

    this.active.set(msgId, ctrl);

    try {
      const inProgress = await game.isInProgress(ctrl.signal);

      if (!inProgress) {
        console.log(`[Game#${gameId}] ⬇️  Game is already finished`);
        await game.download(this.storage, ctrl.signal);
      } else {
        await game.stream(this.gameStream, this.storage, ctrl.signal);
      }

      await this.queue.ack(this.groupName, msgId);
      console.log(`[Game#${gameId}] ✅ ACKed & finished`);
    } catch (err) {
      if (ctrl.signal.aborted) {
        console.warn(`[Game#${gameId}] ⚠️  Aborted due to shutdown`);
      } else {
        if (err instanceof DOMException) {
          console.error(`[Game#${gameId}] ❌ ${err.name}: ${err.message}`);
        } else {
          console.error(`[Game#${gameId}] ❌ Error`, err);
        }
        // do NOT ack → message will be picked by another worker
      }
    } finally {
      this.active.delete(msgId);
    }
  }

  private scheduleHeartbeat() {
    this.hbTimer = setInterval(async () => {
      if (this.active.size === 0) return;

      try {
        for (const msgId of this.active.keys()) {
          await this.queue.heartbeat(this.groupName, this.consumerId, msgId);
        }
      } catch (e) {}
    }, this.heartbeatMs);
  }
}
