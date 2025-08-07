import { env } from 'utils';

export const config = {
  port: parseInt(env('GW_HTTP_PORT', '3100'), 10),
  endpoint: env('GW_ENDPOINT', 'https://openfront.io'),
  authHeader: env('GW_AUTH_HEADER', 'Authorization'),
  authToken: env('GW_AUTH_TOKEN', ''),
  throttle: parseInt(env('GW_THROTTLE', '1100'), 10),
};
