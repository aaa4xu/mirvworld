import promClient from 'prom-client';

// Create the main registry
export const register = new promClient.Registry();

// Collect default Node/Bun process metrics
promClient.collectDefaultMetrics({
  register, // where to store the metrics
  prefix: 'gateway_', // optional prefix for every metric name
});

// Custom metrics for HTTP traffic
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'],
  registers: [register],
});

export const upstreamRequestDuration = new promClient.Histogram({
  name: 'upstream_requests_duration',
  help: 'HTTP request latency to upstream in seconds',
  labelNames: ['method', 'route', 'code'],
  // Prometheus-friendly buckets (seconds)
  buckets: [0.25, 0.5, 0.75, 1, 1.25, 3],
  registers: [register],
});
