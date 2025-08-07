import { type Counter } from 'prom-client';

export const withMetrics =
  (httpRequestsTotal: Counter) =>
  (handler: (request: Request) => Promise<Response> | Response) =>
  async (request: Request) => {
    const route = new URL(request.url).pathname;

    try {
      const res = await handler(request);
      httpRequestsTotal.inc({ method: 'GET', route, code: res.status });
      return res;
    } catch (e) {
      httpRequestsTotal.inc({ method: 'GET', route, code: 500 });
      throw e;
    }
  };
