import type { Readable } from 'node:stream';

export class CompressedFile {
  public static async json(stream: Promise<Readable>) {
    const compressed = await this.read(await stream);
    const decompressed = await Bun.zstdDecompress(compressed);
    return JSON.parse(decompressed.toString());
  }

  public static read(stream: Readable) {
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
