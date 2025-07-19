import {
  GameEndInfoSchema as GameGameEndInfoSchema,
  PlayerRecordSchema as GamePlayerRecordSchema,
  GameRecordSchema as GameGameRecordSchema,
} from '../game/src/core/Schemas.ts';

export const PlayerRecordSchema = GamePlayerRecordSchema.omit({
  persistentID: true,
});

export const GameEndInfoSchema = GameGameEndInfoSchema.extend({
  players: PlayerRecordSchema.array(),
});

export const GameRecordSchema = GameGameRecordSchema.extend({
  info: GameEndInfoSchema,
});
