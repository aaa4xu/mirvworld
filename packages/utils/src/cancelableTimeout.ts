/**
 * Creates a promise that resolves after a given delay, with support for being aborted using an AbortSignal
 */
export function cancelableTimeout(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let timerId: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      if (timerId) {
        clearTimeout(timerId);
      }

      reject(new Error('Aborted'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    timerId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
  });
}
