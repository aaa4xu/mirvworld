import type { GameId } from './OpenFront/GameId.ts';
import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import { GameConnection } from './GameConnection.ts';
import { GameSession } from './GameSession.ts';
import { ReplayStorage } from './ReplayStorage.ts';
import { GameStream } from './GameStream.ts';
import { cancelableTimeout } from './Utils.ts';
import { StaleGameError } from './Errors/StaleGameError.ts';

export class Game {
  public constructor(
    public readonly id: GameId,
    public readonly startAt: number,
    private readonly server: OpenFrontServerAPI,
  ) {}

  public isInProgress(signal: AbortSignal) {
    if (this.startAt + 3 * 60 * 60 * 1000 < Date.now()) return false; // Max match duration is 3h
    return this.server.gameExists(this.id, signal);
  }

  public async download(storage: ReplayStorage, signal: AbortSignal) {
    console.log(`[Game#${this.id}] 📦 Downloading replay...`);

    const replay = await this.server.archivedGame(this.id, signal);

    if (!replay) {
      throw new Error(`Replay for game ${this.id} is not found`);
    }

    await storage.save(this.id.toString(), replay);
  }

  public async stream(gameStream: GameStream, storage: ReplayStorage, signal: AbortSignal) {
    const msUntilStart = this.startAt - Date.now() + 5_000; // 5 sec delay for game server to start
    if (msUntilStart > 0) {
      console.log(`[Game#${this.id}] 🕝 Game starts in ${Math.round(msUntilStart / 1000)}s`);
      await cancelableTimeout(msUntilStart, signal);
    }

    console.log(`[Game#${this.id}] ⚙️  Starting stream`);

    await new Promise<void>((resolve, reject) => {
      const url = this.server.gameWebsocket(this.id);
      const connection = new GameConnection(() => new WebSocket(url), this.startAt);
      const game = new GameSession(this.id, connection, signal);

      const onConnectionOpen = () => {
        console.log(`[Game#${this.id}] 🔌 Connected to game server`);
      };

      const onConnectionError = (e: unknown) => {
        console.error(`[Game#${this.id}] ❌ Connection error:`, e);
        game.dispose();
        cleanup();
        reject(e);
      };

      const onWinnerEvent = (event: unknown) => {
        onGameEvent('winner', event);
        console.warn(`[Game#${this.id}] 🚨 We have a winner!`);
        tryToDownloadReplay();
      };

      const onGameError = (e: unknown) => {
        if (e instanceof StaleGameError) {
          console.warn(`[Game#${this.id}] 🚨 Game is in stale state, checking for replay...`);
          tryToDownloadReplay();
        } else {
          game.dispose();
          cleanup();
          reject(e);
        }
      };

      const onStartEvent = (event: unknown) => {
        console.log(`[Game#${this.id}] 📺 Game started`);
        onGameEvent('start', event).then(() =>
          gameStream.setExpire(this.id, this.startAt + 3 * 60 * 60 * 1000 - Date.now()),
        );
      };

      const onTurnEvent = (event: unknown) => onGameEvent('turn', event);

      const onGameEvent = (type: string, event: unknown) => {
        const json = JSON.stringify({ type, event });
        return gameStream.push(this.id, json);
      };

      function cleanup() {
        connection.off('open', onConnectionOpen);
        connection.off('error', onConnectionError);
        game.off('start', onStartEvent);
        game.off('turn', onTurnEvent);
        game.off('winner', onWinnerEvent);
        game.off('error', onGameError);
      }

      const tryToDownloadReplay = async () => {
        await cancelableTimeout(5000, signal);
        try {
          const replay = await this.server.archivedGame(this.id, signal);

          if (!replay) {
            console.log(`[Game#${this.id}] ⏳ No replay found for now`);
            return;
          }

          console.log(`[Game#${this.id}] 📦 Replay already exists, downloading...`);
          await storage.save(this.id.toString(), replay);

          setTimeout(() => gameStream.remove(this.id), 1000);
          game.dispose();
          cleanup();
          resolve();
        } catch (ignored) {}
      };

      connection.on('open', onConnectionOpen);
      connection.on('error', onConnectionError);
      game.on('start', onStartEvent);
      game.on('turn', onTurnEvent);
      game.on('winner', onWinnerEvent);
      game.on('error', onGameError);

      game.start();
    });
  }
}
