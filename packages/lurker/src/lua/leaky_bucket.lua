---@diagnostic disable: undefined-global
-- PURPOSE
--   Atomically acquire ONE token from a distributed leaky-bucket.
--   * If a token is available → {1, 0}
--   * Otherwise              → {0, wait_ms}
--
--   The bucket refills at a rate of  R  tokens **per second** and
--   can hold at most `capacity` tokens.
--
-- WHY SERVER TIME?
--   * Eliminates clock-skew between clients.
--   * Prevents malicious clients from forging timestamps.
--   * `redis.call('TIME')` returns the authoritative Redis time:
--       { <unix-seconds>, <microseconds> }.
--
-- INPUT
--   KEYS[1] : string   bucket hash key (e.g. "rate:openfront")
--
--   ARGV[1] : number   refill_rate_per_sec   (tokens / second; may be float)
--   ARGV[2] : number   capacity              (max tokens)
--
-- REDIS STATE  (hash at KEYS[1])
--   "tokens" : current token balance (float)
--   "last"   : last update time in ms (integer)
--
-- OUTPUT
--   { 1, 0 }           → token granted immediately
--   { 0, wait_ms }     → caller should wait `wait_ms` before retry
--
-- TTL
--   Hash expires after the time needed to fully refill an empty bucket.

-----------------------------------------------------------------------
-- helpers
-----------------------------------------------------------------------
local refill_sec = tonumber(ARGV[1])             -- tokens / second
local capacity   = tonumber(ARGV[2])

-- Convert to tokens / millisecond
local rate = refill_sec / 1000.0                 -- tokens / ms

-- --- current Redis time (ms) ---
local redis_time = redis.call('TIME')
local now = (tonumber(redis_time[1]) * 1000) + math.floor(tonumber(redis_time[2]) / 1000)

-----------------------------------------------------------------------
-- load previous state; assume full bucket if absent
-----------------------------------------------------------------------
local data   = redis.call('HMGET', KEYS[1], 'tokens', 'last')
local tokens = tonumber(data[1])
local last   = tonumber(data[2])

if not tokens then tokens = capacity end
if not last   then last   = now      end

-----------------------------------------------------------------------
-- refill since last access
-----------------------------------------------------------------------
local elapsed = math.max(0, now - last)          -- ms
tokens        = math.min(capacity, tokens + elapsed * rate)

-----------------------------------------------------------------------
-- try spend a token
-----------------------------------------------------------------------
local allowed = 0
local wait_ms = 0

if tokens >= 1 then
  tokens  = tokens - 1
  allowed = 1
else
  local shortage = 1 - tokens                    -- fractional shortage
  wait_ms = math.ceil(shortage / rate)           -- time until one token
end

-----------------------------------------------------------------------
-- persist state + TTL
-----------------------------------------------------------------------
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)

local ttl = math.ceil(capacity * 1000.0 / refill_sec) -- ms to refill from 0→capacity
redis.call('PEXPIRE', KEYS[1], ttl)

return { allowed, wait_ms }
