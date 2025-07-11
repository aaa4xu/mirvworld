import { GameRunner } from '../../game/src/core/GameRunner.ts';
import { TurnSchema } from '../../game/src/core/Schemas.ts';
import * as z from 'zod';
import { BaseLensTracker } from '../../../../src/LensTrackers/BaseLensTracker.ts';

export class TypedLensTracker extends BaseLensTracker<GameRunner, Turn> {}

export type Turn = z.infer<typeof TurnSchema>;
