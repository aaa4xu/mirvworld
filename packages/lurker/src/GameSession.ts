import { EventEmitter } from 'node:events';
import z from 'zod';
import type { GameId } from './OpenFront/GameId.ts';
import type { GameConnection } from './GameConnection.ts';
import {
  type ClientJoinMessage,
  type ClientPingMessage,
  ClientSendWinnerSchema,
  ServerMessageSchema,
  type Turn,
} from 'openfront/game/src/core/Schemas.ts';
import crypto from 'node:crypto';
import { customAlphabet } from 'nanoid';
import { StaleGameError } from './Errors/StaleGameError.ts';

export class GameSession extends EventEmitter {
  private static readonly nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

  private readonly options: Required<GameSessionOptions>;
  private readonly token = crypto.randomUUID();
  private readonly clientId = GameSession.nanoid();
  private lastIntentAt = -1;

  #state: SessionState = SessionState.Idle;

  private lastTurn = -1;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  public get state() {
    return this.#state;
  }

  public constructor(
    private readonly id: GameId,
    private readonly connection: GameConnection,
    private readonly abort: AbortSignal,
    opts: GameSessionOptions = {},
  ) {
    super();
    this.options = {
      pingInterval: 5_000,
      ...opts,
    };

    this.abort.addEventListener('abort', () => this.dispose(), { once: true });
    this.wireConnection();
  }

  public start() {
    if (this.#state === SessionState.Disposed) {
      throw new Error('GameSession already disposed');
    }

    if (this.#state !== SessionState.Idle) {
      return;
    }

    this.#state = SessionState.Starting;
    this.connection.connect();
  }

  public dispose() {
    if (this.#state === SessionState.Disposed) return;
    this.#state = SessionState.Disposed;

    this.unwireConnection();
    this.stopPingLoop();
    this.connection.dispose();
    this.removeAllListeners();
  }

  private wireConnection(): void {
    this.connection.on('open', this.onOpen);
    this.connection.on('message', this.onMessage);
    this.connection.on('close', this.onClose);
  }

  private unwireConnection(): void {
    this.connection.off('open', this.onOpen);
    this.connection.off('message', this.onMessage);
    this.connection.off('close', this.onClose);
  }

  private readonly onOpen = () => {
    if (this.#state === SessionState.Disposed) return;
    console.log(`[GameSession#${this.id}] Connected to game server`);
    this.connection.send(this.buildJoin());
    this.startPingLoop();
    this.#state = SessionState.Running;
  };

  private readonly onMessage = (raw: string) => {
    this.handleServerMessage(raw);
  };

  private readonly onClose = () => {
    if (this.#state !== SessionState.Disposed) {
      console.warn(`[GameSession#${this.id}] Connection closed`);
    }

    this.stopPingLoop();
  };

  private handleServerMessage(raw: string): void {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      console.warn(`[GameSession#${this.id}] Received invalid message:`, error);
      return;
    }

    const message = IncomingMessageSchema.safeParse(json);

    if (!message.success) {
      console.warn(`[GameSession#${this.id}] Received invalid message:`, message.error);
      return;
    }

    switch (message.data.type) {
      case 'start': {
        this.emit('start', {
          ...message.data,
          turns: [],
        });
        this.lastIntentAt = Date.now();
        for (const t of message.data.turns) {
          this.processTurn(t);
        }
        break;
      }
      case 'turn': {
        this.processTurn(message.data.turn);
        break;
      }
      case 'winner':
        this.emit('winner', message.data);
        this.dispose();
        break;

      case 'prestart':
      case 'ping':
      case 'desync':
        break;

      default:
        console.warn(`[GameSession#${this.id}] Received unsupported message:`, message.data);
    }
  }

  private processTurn(turn: Turn): void {
    if (turn.turnNumber <= this.lastTurn) return;
    this.lastTurn = turn.turnNumber;
    if (turn.intents && turn.intents.length > 0) {
      this.lastIntentAt = Date.now();
    }
    this.emit('turn', turn);
  }

  private buildJoin(): string {
    const message: ClientJoinMessage = {
      type: 'join',
      gameID: this.id.toString(),
      lastTurn: Math.max(0, this.lastTurn),
      clientID: this.clientId,
      token: this.token,
      username: 'MIRVWorld',
      flag: '',
    };

    return JSON.stringify(message);
  }

  private buildPing(): string {
    const message: ClientPingMessage = { type: 'ping' };
    return JSON.stringify(message);
  }

  private stopPingLoop(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.pingTimer = null;
  }

  private startPingLoop(): void {
    if (this.pingTimer) return; // уже запущен

    this.pingTimer = setInterval(() => {
      try {
        this.connection.send(this.buildPing());
      } catch {
        /* сокет закрыт — будет реконнект */
      }

      if (this.lastIntentAt > 0 && Date.now() - this.lastIntentAt > 60_000) {
        this.lastIntentAt = Date.now();
        this.emit('error', new StaleGameError());
      }
    }, this.options.pingInterval);
  }
}

export interface GameSessionOptions {
  pingInterval?: number;
}

export const IncomingMessageSchema = z.union([ServerMessageSchema, ClientSendWinnerSchema]);
export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

export const enum SessionState {
  Idle = 'Idle', // создан, не запускался
  Starting = 'Starting', // выполняется start()
  Running = 'Running', // веб‑сокет открыт, игра активна
  Disposed = 'Disposed', // вызван dispose()
}
