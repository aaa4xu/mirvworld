import { describe, expect, it } from 'bun:test';
import { createMinioClientOptions } from './createMinioClientOptions';

describe('createMinioClientOptions', () => {
  it('should parse options from url string', () => {
    const options = createMinioClientOptions('https://user:password@server:1000');

    expect(options).toEqual({
      endPoint: 'server',
      port: 1000,
      useSSL: true,
      accessKey: 'user',
      secretKey: 'password',
    });
  });
});
