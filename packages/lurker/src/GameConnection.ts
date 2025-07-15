import { EventEmitter } from 'node:events';
import { MaxRetriesExceededError } from './Errors/MaxRetriesExceededError.ts';
import debug from 'debug';

const log = debug('mirvworld:lurker:GameConnection');
const eventsLog = debug('mirvworld:lurker:GameConnection:events');

export class GameConnection extends EventEmitter {
  private socket: WebSocket | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private state: ConnectionState = ConnectionState.Idle;

  private readonly opts: Required<GameConnectionOptions>;

  public constructor(
    private readonly factory: WebSocketFactory,
    private readonly idleStartAt: number,
    opts: GameConnectionOptions = {},
  ) {
    super();

    this.opts = {
      idleTimeout: 5_000,
      maxRetries: 4,
      backoffFactor: 1.5,
      backoffStart: 1_000,
      maxBackoff: 30_000,
      ...opts,
    };
  }

  public connect(): void {
    if (
      [
        ConnectionState.Disposed,
        ConnectionState.Open,
        ConnectionState.Connecting,
        ConnectionState.Reconnecting,
      ].includes(this.state)
    ) {
      return;
    }

    this.openSocket();
  }

  public disconnect(): void {
    if (this.state !== ConnectionState.Open && this.state !== ConnectionState.Connecting) {
      return;
    }

    this.clearTimers();

    if (this.socket) {
      this.state = ConnectionState.Closing;
      this.socket.close(1000, 'User disconnected');
    }
  }

  public send(data: string): void {
    if (this.state !== ConnectionState.Open || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('GameConnection: socket not open');
    }

    this.socket.send(data);
  }

  public dispose(): void {
    if (this.state === ConnectionState.Disposed) return;
    this.state = ConnectionState.Disposed;

    this.clearTimers();
    if (this.socket) {
      this.socket.close(4001, 'disposed');
      this.detachSocket(this.socket);
      this.socket = null;
    }
    this.removeAllListeners();
  }

  private openSocket(): void {
    if (this.state === ConnectionState.Disposed) return;
    this.state = ConnectionState.Connecting;

    this.socket = this.factory();
    log('socket created');

    this.socket.addEventListener('open', this.handleOpen);
    this.socket.addEventListener('message', this.handleMessage);
    this.socket.addEventListener('error', this.handleError);
    this.socket.addEventListener('close', this.handleClose);
  }

  private detachSocket(socket: WebSocket): void {
    if (!socket) return; // Seen that case in production for some reason
    socket.removeEventListener('open', this.handleOpen);
    socket.removeEventListener('message', this.handleMessage);
    socket.removeEventListener('error', this.handleError);
    socket.removeEventListener('close', this.handleClose);
  }

  private handleOpen = (): void => {
    if (this.state === ConnectionState.Disposed) return;
    log('socket open');

    this.attempt = 0; // success, reset counter
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.state = ConnectionState.Open;
    this.emit('open');

    const timeUntilStart = this.idleStartAt - Date.now();
    if (timeUntilStart < 1) {
      this.touchIdleTimer();
    } else {
      this.idleTimer = setTimeout(() => this.touchIdleTimer(), timeUntilStart);
    }
  };

  private handleMessage = (event: MessageEvent<unknown>): void => {
    if (this.state !== ConnectionState.Open) return;

    this.touchIdleTimer();

    if (typeof event.data !== 'string') {
      // Unexpected message format
      return;
    }

    eventsLog(`message ${event.data}`);
    this.emit('message', event.data);
  };

  private handleError = (err: Event): void => {
    if (this.state === ConnectionState.Disposed) return;
    log('socket error');
    // Принудительно закрываем сокет, чтобы запустить handleClose и логику реконнекта
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.state = ConnectionState.Closing;
      this.socket.close(4003, 'Socket error');
    }
  };

  private handleClose = (event: CloseEvent): void => {
    if (this.socket && event.target !== this.socket) {
      return;
    }
    log('socket closed');

    this.clearTimers();
    this.emit('close', event);

    if (this.socket) {
      this.detachSocket(this.socket);
      this.socket = null;
    }

    if (this.state === ConnectionState.Disposed) {
      return;
    }

    const { maxRetries } = this.opts;
    if (maxRetries !== null && this.attempt >= maxRetries) {
      this.state = ConnectionState.Idle;
      this.emit('error', new MaxRetriesExceededError(this.attempt));
      return;
    }

    this.state = ConnectionState.Reconnecting;
    const delay = this.computeBackoff(++this.attempt);
    this.emit('reconnect', { attempt: this.attempt, delay });
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  };

  private touchIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      log('idle timeout fired');
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.state = ConnectionState.Closing;
        this.socket.close(4000, 'idle timeout');
      }
    }, this.opts.idleTimeout);
  }

  private clearTimers(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.idleTimer = this.reconnectTimer = null;
  }

  private computeBackoff(attempt: number): number {
    const { backoffStart, backoffFactor } = this.opts;
    return Math.min(
      this.opts.maxBackoff,
      Math.floor(backoffStart * Math.pow(backoffFactor, attempt - 1) * (0.5 + Math.random())),
    );
  }
}

export type WebSocketFactory = () => WebSocket;

export interface GameConnectionOptions {
  /** how long we can be idle (no incoming messages) before closing */
  idleTimeout?: number;
  /** maximum reconnection attempts, null → infinite */
  maxRetries?: number | null;
  /** multiplicator for exponential back‑off (≥1). Set 1 for constant delay. */
  backoffFactor?: number;
  /** initial reconnection delay in ms */
  backoffStart?: number;
  maxBackoff?: number;
}

export const enum ConnectionState {
  Idle = 'Idle',
  Connecting = 'Connecting',
  Open = 'Open',
  Closing = 'Closing',
  Reconnecting = 'Reconnecting',
  Disposed = 'Disposed',
}
