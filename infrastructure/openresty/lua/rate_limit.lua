-- =============================================================================
-- rate_limit.lua — Distributed rate limit qua Redis INCR + EXPIRE.
-- Key: rl:<host>:<ip>  |  Limit mặc định: 1000 req/phút/IP/host.
-- =============================================================================
local _M = {}
local redis = require("resty.redis")

local LIMIT_PER_MIN = tonumber(os.getenv("RATE_LIMIT_PER_MIN") or 1000)

function _M.run()
    local ip   = ngx.var.remote_addr
    local host = ngx.var.host
    local key  = "rl:" .. host .. ":" .. ip

    local red = redis:new()
    red:set_timeouts(50, 100, 100)
    local ok, err = red:connect(os.getenv("REDIS_HOST") or "redis", tonumber(os.getenv("REDIS_PORT") or 6379))
    if not ok then return end  -- Fail-open: nếu Redis chết, không chặn user thật.

    local pwd = os.getenv("REDIS_PASSWORD")
    if pwd and pwd ~= "" then red:auth(pwd) end

    local count, e2 = red:incr(key)
    if count == 1 then red:expire(key, 60) end
    red:set_keepalive(10000, 100)

    if count and count > LIMIT_PER_MIN then
        ngx.log(ngx.WARN, "[RATE] block ip=", ip, " host=", host, " n=", count)
        ngx.status = 429
        ngx.header["Retry-After"] = "60"
        ngx.header["Content-Type"] = "application/json"
        ngx.say('{"error":true,"code":"RATE_LIMIT","message":"Too Many Requests"}')
        return ngx.exit(429)
    end
end

return _M
