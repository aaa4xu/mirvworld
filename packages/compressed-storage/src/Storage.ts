export interface Storage {
  write(filename: string, data: Buffer<ArrayBufferLike>, metadata: Record<string, string>): Promise<void>;
  read(filename: string): Promise<Buffer>;
}
