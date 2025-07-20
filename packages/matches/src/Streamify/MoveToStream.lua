--[[
  Atomically moves up to ARGV[1] items from the tail of the list KEYS[1]
  to the stream KEYS[2] where each item is stored under the field "data".

  KEYS[1] source list key
  KEYS[2] destination stream key
  ARGV[1] max number of items to move (positive integer)

  Returns: array of IDs of added stream entries in the order they were moved.
]]--

local src = KEYS[1]
local dst = KEYS[2]
local limit = tonumber(ARGV[1])

if not limit or limit <= 0 then
  return {}
end

local ids = {}

for i = 1, limit do
  local value = redis.call('RPOP', src)
  if not value then
    break
  end
  local id = redis.call('XADD', dst, '*', 'data', value)
  table.insert(ids, id)
end

return ids