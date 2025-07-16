import type { GameId } from './OpenFront/GameId.ts';
import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import { GameConnection } from './GameConnection.ts';
import { GameSession } from './GameSession.ts';
import { ReplayStorage } from './ReplayStorage.ts';
import { GameStream } from './GameStream.ts';
import { cancelableTimeout } from './Utils.ts';
import { StaleGameError } from './Errors/StaleGameError.ts';

export class Game {
  public static readonly MaxDuration = 3 * 60 * 60 * 1000; // Max match duration is 3h

  public constructor(
    public readonly id: GameId,
    public readonly startAt: number,
    private readonly server: OpenFrontServerAPI,
  ) {}

  public isInProgress(signal: AbortSignal) {
    if (this.startAt + Game.MaxDuration < Date.now()) return false;
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
        console.warn(`[Game#${this.id}] 🎉 We have a winner!`);
        tryToDownloadReplay();
      };

      const onStartEvent = (event: unknown) => {
        console.log(`[Game#${this.id}] 📺 Game started`);
        gameStream.setExpire(this.id, this.startAt + Game.MaxDuration - Date.now());
      };

      const onGameError = (e: unknown) => {
        if (e instanceof StaleGameError) {
          console.warn(`[Game#${this.id}] Game is in stale state, checking list of clients...`);
          this.server
            .game(this.id, signal)
            .then(
              async (info) => {
                if (info.clients.length > 1) {
                  console.log(`[Game#${this.id}] There is still ${info.clients.length} clients in the game`);

                  if (await tryToDownloadReplay()) {
                    game.dispose();
                  }

                  return;
                }

                console.warn(`[Game#${this.id}] I'm the only one left, disconnecting...`);
                game.dispose();

                for (let i = 0; i < 10; i++) {
                  if (await tryToDownloadReplay()) {
                    return;
                  }
                  await cancelableTimeout(10_000, signal);
                }

                throw new Error(`[Game#${this.id}] Don't have any idea whats wrong with this game`);
              },
              () => tryToDownloadReplay(),
            )
            .catch((err) => {
              console.error(`[Game#${this.id}] Failed to check for replay of stale game:`, err);
            });
        } else {
          game.dispose();
          cleanup();
          reject(e);
        }
      };

      const onTurnEvent = (event: unknown) => {
        return gameStream.addTurn(this.id, JSON.stringify(event));
      };

      function cleanup() {
        connection.off('open', onConnectionOpen);
        connection.off('error', onConnectionError);
        game.off('start', onStartEvent);
        game.off('turn', onTurnEvent);
        game.off('winner', onWinnerEvent);
        game.off('error', onGameError);
      }

      const tryToDownloadReplay = async (): Promise<boolean> => {
        await cancelableTimeout(5000, signal);
        try {
          const replay = await this.server.archivedGame(this.id, signal);

          if (!replay) {
            console.log(`[Game#${this.id}] ⏳ No replay found for now`);
            return false;
          }

          console.log(`[Game#${this.id}] 📦 Replay already exists, downloading...`);
          await storage.save(this.id.toString(), replay);

          setTimeout(() => gameStream.remove(this.id), 1000);
          game.dispose();
          cleanup();
          resolve();
          return true;
        } catch (ignored) {
          return false;
        }
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
