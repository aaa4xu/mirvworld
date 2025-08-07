# Gateway

**Gateway** is a proxy microservice designed to sit between clients of the Openfront Server API and its origin server.

It solves two main problems:

- **Request Caching & Rate Limiting:** Implements global response caching and rate limiting to reduce the load on the origin server.
- **Cloudflare WAF Bypass:** Allows legitimate clients to bypass the Cloudflare WAF that protects the Openfront Server API from DDoS attacks. It achieves this using an official bypass method.

This project is an open-source alternative to [mirvworld-gateway](https://github.com/aaa4xu/mirvworld-gateway). It provides an identical API but utilizes an official method for bypassing the WAF, ensuring greater stability and reliability.
