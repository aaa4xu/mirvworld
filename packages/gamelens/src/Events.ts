import z from 'zod/v4';

export const BigIntStringSchema = z.preprocess((val) => {
  if (typeof val === 'string' && /^\d+$/.test(val)) return BigInt(val);
  if (typeof val === 'bigint') return val;
  return val;
}, z.bigint());

export const GamelensTurnEventSchema = z.object({
  type: z.string(),
  turn: z.number(),
  player: z.number(),
});

export const GamelensTerraAttackEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('attack.terra'),
  troops: BigIntStringSchema,
});

export const GamelensPlayerAttackEventSchema = GamelensTerraAttackEventSchema.extend({
  type: z.literal('attack.player'),
  target: z.number(),
});

export const GamelensUnitBuildEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('unit.build'),
  unit: z.string(),
});

export const GamelensUnitCapturedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('unit.captured'),
  unit: z.string(),
  from: z.number(),
});

export const GamelensUnitDestroyedEventSchema = GamelensUnitCapturedEventSchema.extend({
  type: z.literal('unit.destroyed'),
});

export const GamelensTradeDestroyedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('trade.destroyed'),
  owner: z.number(),
});

export const GamelensTradeArrivedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('trade.arrived'),
  owner: z.number(),
  gold: BigIntStringSchema,
});

export const GamelensCapturedTradeArrivedEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('trade.captured'),
  owner: z.number(),
  gold: BigIntStringSchema,
});

export const GamelensKillEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('kill'),
  target: z.number(),
  gold: BigIntStringSchema,
});

export const GamelensDeathEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('death'),
});

export const GamelensBombLandedTerraEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('bomb.landed.terra'),
  nukeType: z.string(),
});

export const GamelensBombLandedPlayerEventSchema = GamelensBombLandedTerraEventSchema.extend({
  type: z.literal('bomb.landed.player'),
  target: z.number(),
});

export const GamelensBombLaunchedIntoTerraEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('bomb.launched.terra'),
  nukeType: z.string(),
});

export const GamelensBombLaunchedIntoPlayerEventSchema = GamelensBombLaunchedIntoTerraEventSchema.extend({
  type: z.literal('bomb.launched.player'),
  target: z.number(),
});

export const GamelensSpawnEventSchema = GamelensTurnEventSchema.extend({
  type: z.literal('spawn'),
  x: z.number(),
  y: z.number(),
});

export const GamelensTilesEventSchema = z.object({
  type: z.literal('tiles'),
  turn: z.number(),
  players: z.record(z.string(), z.number()),
});

export const GamelensGoldFromWorkersEventSchema = z.object({
  type: z.literal('gold.workers'),
  turn: z.number(),
  players: z.record(z.string(), BigIntStringSchema),
});

export const GamelensPlayersMappingEventSchema = z.object({
  type: z.literal('players.mapping'),
  turn: z.number(),
  players: z.record(
    z.string(),
    z.object({ id: z.number(), name: z.string(), type: z.string(), team: z.string().nullable() }),
  ),
});

export const GamelensAttackEventSchema = z.discriminatedUnion('type', [
  GamelensTerraAttackEventSchema,
  GamelensPlayerAttackEventSchema,
]);

export const GamelensEventSchema = z.discriminatedUnion('type', [
  GamelensAttackEventSchema,
  GamelensUnitBuildEventSchema,
  GamelensUnitCapturedEventSchema,
  GamelensUnitDestroyedEventSchema,
  GamelensTradeDestroyedEventSchema,
  GamelensKillEventSchema,
  GamelensBombLandedPlayerEventSchema,
  GamelensBombLandedTerraEventSchema,
  GamelensDeathEventSchema,
  GamelensSpawnEventSchema,
  GamelensTradeArrivedEventSchema,
  GamelensCapturedTradeArrivedEventSchema,
  GamelensTilesEventSchema,
  GamelensGoldFromWorkersEventSchema,
  GamelensPlayersMappingEventSchema,
  GamelensBombLaunchedIntoPlayerEventSchema,
  GamelensBombLaunchedIntoTerraEventSchema,
]);

export const GamelensEventsSchema = z.array(GamelensEventSchema);
export type GamelensEvents = z.infer<typeof GamelensEventsSchema>;

export type GamelensEvent = z.infer<typeof GamelensEventSchema>;
export type GamelensAttackEvent = z.infer<typeof GamelensAttackEventSchema>;
