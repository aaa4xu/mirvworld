-- KEYS[1] = ready‑sorted‑set
-- ARGV[1] = now (epoch ms)
-- ARGV[2] = retryDelay (ms)
-- ARGV[3] = entryKeyPrefix

local ready = KEYS[1]
local now   = tonumber(ARGV[1])
local retry = tonumber(ARGV[2])
local prefix= ARGV[3]

-- Retrieve
local ids = redis.call('ZRANGEBYSCORE', ready, '-inf', now, 'LIMIT', 0, 1)
if #ids == 0 then
  return nil
end

local id    = ids[1]
local entry = prefix .. id
local next  = now + retry

-- Reschedule
redis.call('ZREM',  ready, id)
redis.call('HINCRBY', entry, 'attempts', 1)
redis.call('HSET',   entry, 'lastAttemptAt', now)
redis.call('ZADD',   ready, next, id)

return id