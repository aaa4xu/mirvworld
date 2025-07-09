/**
 * A generic class to listen for messages and errors from a Web Worker
 * and yield them as an asynchronous stream of messages.
 * This version uses an internal queue to prevent message loss under high frequency.
 */
export class WebWorkerMessageListener<TMessage> {
  private worker: Worker;
  private messageQueue: TMessage[] = [];
  private errorQueue: Error[] = [];
  private waitingResolver: ((value: TMessage | PromiseLike<TMessage>) => void) | null = null;
  private waitingRejector: ((reason?: unknown) => void) | null = null;
  private isTerminated = false; // Flag to indicate completion of work

  private messageListener: ((event: MessageEvent) => void) | null = null;
  private errorListener: ((event: ErrorEvent) => void) | null = null;

  constructor(worker: Worker) {
    this.worker = worker;

    this.messageListener = (event: MessageEvent) => {
      const message = event.data as TMessage;
      if (this.waitingResolver) {
        // If there is a pending promise, resolve it immediately
        const resolver = this.waitingResolver;
        this.waitingResolver = null;
        this.waitingRejector = null; // Also reset the rejector
        resolver(message);
      } else {
        // Otherwise, add the message to the queue
        this.messageQueue.push(message);
      }
    };

    this.errorListener = (errorEvent: ErrorEvent) => {
      console.error('Error from worker global scope:', errorEvent.message, errorEvent.filename, errorEvent.lineno);
      const error = new Error(`Worker error: ${errorEvent.message || 'Unknown worker error'}`);
      if (this.waitingRejector) {
        // If there is a pending promise, reject it
        const rejector = this.waitingRejector;
        this.waitingResolver = null;
        this.waitingRejector = null;
        rejector(error);
      } else {
        // Otherwise, add the error to the error queue
        this.errorQueue.push(error);
      }
    };

    this.worker.addEventListener('message', this.messageListener);
    this.worker.addEventListener('error', this.errorListener);
  }

  /**
   * Listens to messages from the worker.
   * The generator continues to yield messages until the worker terminates,
   * an unrecoverable error occurs in the worker, or the consumer stops iterating.
   *
   * It's the responsibility of the code using this listener to terminate the worker
   * when it's no longer needed.
   */
  public async *listen(): AsyncGenerator<TMessage, void, unknown> {
    try {
      while (!this.isTerminated) {
        // Continue until explicitly indicated to terminate
        if (this.errorQueue.length > 0) {
          // If there are errors in the queue, throw the first one
          const error = this.errorQueue.shift()!;
          throw error;
        }

        if (this.messageQueue.length > 0) {
          // If there are messages in the queue, yield the first one
          yield this.messageQueue.shift()!;
          continue; // Move to the next iteration to check the queues again
        }

        // If there are no queues, wait for the next message/error
        try {
          const message = await new Promise<TMessage>((resolve, reject) => {
            this.waitingResolver = resolve;
            this.waitingRejector = reject;
          });
          yield message;
        } catch (error) {
          // This error came from waitingRejector (i.e., from errorListener)
          // or if the generator was terminated externally while we were waiting.
          if (error instanceof Error && error.message.startsWith('WebWorkerMessageListener: Generator terminated')) {
            // This is a specific error from finally, just exit
            this.isTerminated = true; // Set the flag to exit the loop
            return;
          }
          throw error; // Re-throw other errors
        } finally {
          // Reset if the promise has completed (successfully or with an error),
          // but the listeners have not yet been called to resolve/reject it
          // (e.g., if the generator was terminated externally)
          this.waitingResolver = null;
          this.waitingRejector = null;
        }
      }
    } finally {
      this.isTerminated = true; // Ensure it's marked as terminated

      // Cleanup listeners
      if (this.messageListener) {
        this.worker.removeEventListener('message', this.messageListener);
        this.messageListener = null;
      }
      if (this.errorListener) {
        this.worker.removeEventListener('error', this.errorListener);
        this.errorListener = null;
      }

      // If there was a pending promise when exiting the generator (e.g., consumer.return()),
      // reject it.
      if (this.waitingRejector) {
        this.waitingRejector(new Error('WebWorkerMessageListener: Generator terminated while awaiting message.'));
        this.waitingResolver = null;
        this.waitingRejector = null;
      }
    }
  }
}
