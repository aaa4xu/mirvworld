import jwt from 'jsonwebtoken';
import type { TokenPayload } from '../src/Schema/TokenPayload.ts';
import { config } from '../config.ts';

const payload: TokenPayload = {
  scp: ['admin'],
};

const token = jwt.sign(payload, config.http.secret, {
  algorithm: 'HS256',
  issuer: 'mirvworld',
  expiresIn: '7d',
});

console.log(token);
