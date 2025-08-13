-- Atomically apply rating deltas for multiple clans & mark gameId processed.
-- KEYS[1] = processedKey (e.g., "rating:applied:{gameId}")
-- KEYS[2] = leaderboardKey
-- KEYS[3..2+N] = ratingKey for each clan (hash)
-- ARGV[1] = gameId (for logs only)
-- ARGV[2] = N (number of clans)
-- ARGV[3] = ordinalK (e.g., 3)
-- ARGV[4] = default mu
-- ARGV[5] = default sigma
-- ARGV[6..] = tuples (tag, dMu, dSigma, dGames) x N

local was_set = redis.call("SETNX", KEYS[1], "1")
if was_set == 0 then
  return { "SKIP" } -- already processed
end

local leaderboard = KEYS[2]
local n = tonumber(ARGV[2])
local K = tonumber(ARGV[3])
local mu0 = tonumber(ARGV[4])
local sigma0 = tonumber(ARGV[5])

local out = {} -- flattened [tag, mu, sigma, games, score] x N

for i = 1, n do
  local base = 5 + (i - 1) * 4
  local tag    = ARGV[base + 1]
  local dMu    = tonumber(ARGV[base + 2])
  local dSigma = tonumber(ARGV[base + 3])
  local dGames = tonumber(ARGV[base + 4])

  local rk = KEYS[2 + i]

  local mu    = tonumber(redis.call("HGET", rk, "mu"))    or mu0
  local sigma = tonumber(redis.call("HGET", rk, "sigma")) or sigma0
  local games = tonumber(redis.call("HGET", rk, "games")) or 0

  mu    = mu + dMu
  sigma = math.max(0.001, sigma + dSigma)
  games = math.max(0, games + dGames)

  redis.call("HSET", rk, "mu", tostring(mu), "sigma", tostring(sigma), "games", tostring(games))

  local score = mu - K * sigma
  redis.call("ZADD", leaderboard, score, tag)

  table.insert(out, tag)
  table.insert(out, tostring(mu))
  table.insert(out, tostring(sigma))
  table.insert(out, tostring(games))
  table.insert(out, tostring(score))
end

return out
