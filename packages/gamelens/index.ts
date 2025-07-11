import { LensStats } from './src/LensStats.ts';
import type { ReplayRunner } from './src/ReplayRunner.ts';
import { VersionReplayRunner as ReplayRunnerSHA4339644 } from './versions/v0.23.16/src/VersionReplayRunner.ts';
import { VersionReplayRunner as ReplayRunnerSHA05d6c7b } from './versions/v0.24.0-beta2/src/VersionReplayRunner.ts';

const runners = new Map<string, ReplayRunner<unknown>>();
runners.set('4339644', new ReplayRunnerSHA4339644('./versions/v0.23.16/game/resources/maps'));
runners.set('05d6c7b', new ReplayRunnerSHA05d6c7b('./versions/v0.24.0-beta2/game/resources/maps'));

const replay = await Bun.file('replay-v0.24.0-beta2.json').json();
const commit = replay.gitCommit.slice(0, 7);

if (!runners.has(commit)) {
  throw new Error(`No runner for commit ${commit}`);
}

const stats = new LensStats();
await runners.get(commit)!.process(replay, stats);

console.log(stats);

/*
Bun.serve({
  routes: {
    '/api/replay': {
      POST: async (req) => {
        const taskId = Bun.randomUUIDv7();
        const json = await req.json();

        return Response.json(
          {
            id: taskId,
          },
          { status: 201 },
        );
      },
    },
  },
  port: config.http.port,
});
*/
