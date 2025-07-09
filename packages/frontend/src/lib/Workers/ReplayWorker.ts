/// <reference lib="webworker" />
import { ReplayPlayer } from '$lib/ReplayPlayer';
import { PlayerType } from 'openfront-client/src/core/game/Game';
import type { ReplayWorkerInfoEvent } from '$lib/Workers/ReplayWorkerEvent';

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const response = await fetch(event.data.url);
  const replay = await response.json();
  const player = new ReplayPlayer();
  console.log('Starting...');

  let places = new Set<string>();
  const game = await player.play({
    replay: replay,
    onProgress: (p) => {
      const humans = p.game.allPlayers().filter((p) => p.type() === PlayerType.Human);

      for (const player of humans) {
        if (places.has(player.id())) continue;

        if (!player.isAlive() && !p.game.inSpawnPhase()) {
          postMessage({
            clientID: player.clientID() ?? 'unknown',
            index: humans.length - places.size,
            tiles: player.numTilesOwned(),
            progress: p.turn / replay.turns.length,
          } satisfies ReplayWorkerInfoEvent);
          places.add(player.id());
        }
      }
    },
  });

  const humans = game.allPlayers().filter((p) => p.type() === PlayerType.Human);
  game
    .players()
    .filter((p) => p.type() === PlayerType.Human)
    .sort((a, b) => a.numTilesOwned() - b.numTilesOwned())
    .forEach((player, index, arr) => {
      postMessage({
        clientID: player.clientID() ?? 'unknown',
        index: humans.length - (places.size + index),
        tiles: player.numTilesOwned(),
        progress: 1,
      } satisfies ReplayWorkerInfoEvent);
    });

  console.log('Done!', places.values());
};

// Define the types for messages sent to the worker
export interface IncomingMessage {
  url: string;
}

export {};
