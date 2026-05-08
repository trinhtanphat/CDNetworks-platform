-- =============================================================================
-- origin_lookup.lua — Tra cứu origin URL theo Host từ Redis.
-- Redis key:  origin:<hostname>  =  http(s)://<origin-host>[:port]
-- =============================================================================
local _M = {}
local redis = require("resty.redis")

local CACHE = ngx.shared.cert_cache  -- tái dùng share dict
local CACHE_TTL = 60

function _M.resolve()
    local host = ngx.var.host
    local cached = CACHE:get("origin:" .. host)
    if cached then return cached end

    local red = redis:new()
    red:set_timeouts(100, 200, 200)
    local ok = red:connect(os.getenv("REDIS_HOST") or "redis", tonumber(os.getenv("REDIS_PORT") or 6379))
    if not ok then return "http://127.0.0.1:80" end

    local pwd = os.getenv("REDIS_PASSWORD")
    if pwd and pwd ~= "" then red:auth(pwd) end

    local origin = red:get("origin:" .. host)
    red:set_keepalive(10000, 100)

    if origin == ngx.null or not origin then
        return "http://127.0.0.1:80"
    end
    CACHE:set("origin:" .. host, origin, CACHE_TTL)
    return origin
end

return _M
