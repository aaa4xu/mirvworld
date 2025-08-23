import { Meta } from './src/Meta.ts';
import { RedisClient } from 'bun';
import { config } from './config.ts';
import { MongoClient } from 'mongodb';

const redis = new RedisClient(config.redis);

const mongo = await MongoClient.connect(config.mongodb.url);
const mongoDatabase = mongo.db(config.mongodb.database);

const meta25 = new Meta(
  ['3fab7ef81447c0defed637972a7b7c1d011996a8', '3fc34c931eacc9bf8747794078b4f529c3ea5ba2'],
  mongoDatabase,
  redis,
);

const meta24 = new Meta(
  ['c7fb5790256814340ed0bb590489eb97198b21c3', 'cf662bc1bc2fc9e1d98d16f2dd03cfd4d402a1dd'],
  mongoDatabase,
  redis,
);

console.log('v24', await meta24.stats());
console.log('v25', await meta25.stats());
process.exit(0);
