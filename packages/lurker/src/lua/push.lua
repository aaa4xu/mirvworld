---@diagnostic disable: undefined-global
-- PURPOSE
--   Atomically mark a lobby ID as "seen" (with TTL) and push its metadata
--   to a Redis Stream, but only if this lobby has not been processed before.
--
-- INPUT
--   KEYS[1] : string  ->  "seen:<lobbyId>"      -- deduplication key
--   KEYS[2] : string  ->  "lobbies:queue"       -- target stream
--
--   ARGV[1] : number  ->  ttl_ms                -- how long to keep the seen flag
--   ARGV[2] : string  ->  lobbyId
--   ARGV[3] : string  ->  startAt               -- Unix epoch ms or any string
--   ARGV[4] : string  ->  infoJson              -- JSON with extra match data
--
-- OUTPUT
--   integer 1  -> lobby was new, pushed to the stream
--   integer 0  -> lobby was already seen, nothing was added

-- deduplication
if redis.call('EXISTS', KEYS[1]) == 1 then
  return 0 -- lobby already processed
end

-- mark as seen with TTL
redis.call('SET', KEYS[1], 1, 'PX', ARGV[1])

-- publish new id to stream
redis.call('XADD', KEYS[2], '*',
           'id',      ARGV[2],
           'startAt', ARGV[3],
           'info',    ARGV[4])

return 1 -- new lobby id
