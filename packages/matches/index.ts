import { RedisClient } from 'bun';
import { config } from './config.ts';
import { Client } from 'minio';
import { appRouter } from './src/trpc/router.ts';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createContext } from './src/trpc/trpc.ts';
import { MinioStorage } from 'compressed-storage';
import { ReplayStorage } from 'replay-storage';
import { GameLensImporter } from './src/Workers/GameLensImporter.ts';
import { OpenFrontPublicAPIWithLimiter } from '@mirvworld/openfront-api';
import { MongoClient } from 'mongodb';
import { MatchesRepository } from './src/mongodb/Repositories/MatchesRepository.ts';
import { MatchInfoImporter } from './src/Workers/MatchInfoImporter.ts';
import { Streamify } from '@mirvworld/redis-streamify';
import { MatchesService } from './src/Services/MatchesService.ts';
import { LeakyBucket } from '@mirvworld/redis-leaky-bucket';
import { PlayersRepository } from './src/mongodb/Repositories/PlayersRepository.ts';
import { PlayersService } from './src/Services/PlayersService.ts';
import { PlayerMatchesImporter } from './src/Workers/PlayerMatchesImporter.ts';
import { LeaderboardPlayersImporter } from './src/Workers/LeaderboardPlayersImporter.ts';
import { TournamentsRepository } from './src/mongodb/Repositories/TournamentsRepository.ts';
import { TournamentsService } from './src/Services/TournamentsService.ts';

const abort = new AbortController();
process.on('SIGTERM', () => abort.abort('SIGTERM'));
process.on('SIGINT', () => abort.abort(''));

const redis = new RedisClient(config.redis);

const mongo = await MongoClient.connect(config.mongodb.url);
const mongoDatabase = mongo.db(config.mongodb.database);

const openfrontRateLimiter = new LeakyBucket({ bucketKey: 'openfront:global', capacity: 4, refillPerSec: 4 }, redis);

const api = new OpenFrontPublicAPIWithLimiter(config.openfront.api, openfrontRateLimiter);

const replaysS3 = new Client(config.replays.s3.endpoint);
const replayStorage = new ReplayStorage(new MinioStorage(config.replays.s3.bucket, replaysS3));
const matchesRepository = new MatchesRepository(mongoDatabase);
const matchesService = new MatchesService(matchesRepository, replayStorage, api);
const playersRepository = new PlayersRepository(mongoDatabase);
const playersService = new PlayersService(playersRepository, api, matchesService);
const tournamentsRepository = new TournamentsRepository(mongoDatabase, matchesRepository);
const tournamentsService = new TournamentsService(tournamentsRepository);

if (!config.readOnly) {
  const streamify = new Streamify(redis, 'matches:storage', 'matches:queue');
  abort.signal.addEventListener('abort', () => streamify.dispose(), { once: true });

  const gamelensImporter = new GameLensImporter('matches:gamelens', redis, matchesService);
  abort.signal.addEventListener('abort', () => gamelensImporter.dispose(), { once: true });

  const matchesImporter = new MatchInfoImporter('matches:queue', redis, matchesService);
  abort.signal.addEventListener('abort', () => matchesImporter.dispose(), { once: true });

  const playersImporter = new PlayerMatchesImporter(playersService);
  abort.signal.addEventListener('abort', () => playersImporter.stop(), { once: true });

  const leaderboardImporter = new LeaderboardPlayersImporter(playersService, api);
  abort.signal.addEventListener('abort', () => leaderboardImporter.stop(), { once: true });
}

const server = createHTTPServer({
  router: appRouter,
  createContext: createContext(config.http.secret, api, replayStorage, matchesService, tournamentsService),
});

/*tournamentsRepository.add({
  rules: {
    id: 'max-tiles',
    params: [10, 8, 6, 4, 2],
  },
  name: 'Tournament of Brilliance',
  slug: 'tournament-of-brilliance',
  startAt: new Date(),
  endAt: new Date(),
});*/

server.listen(config.http.port);
