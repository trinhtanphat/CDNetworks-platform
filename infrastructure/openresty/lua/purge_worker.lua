-- =============================================================================
-- purge_worker.lua — Subscribe Redis Pub/Sub channel "cdn.purge" để xóa
-- file cache nginx khi API phát lệnh purge.
--   Channel msg = JSON {"host":"x","uri":"/path"}  hoặc  "*" để purge all host.
-- =============================================================================
local _M = {}
local redis = require("resty.redis")
local cjson = require("cjson.safe")

local CACHE_DIR = "/var/cache/nginx/edge"

local function path_of(host, uri)
    -- Nginx default cache key = $scheme$host$request_uri (xem nginx.conf).
    -- Hash MD5 theo cùng chuẩn.
    local key = "https" .. host .. uri
    local md5 = ngx.md5(key)
    return string.format("%s/%s/%s/%s", CACHE_DIR, md5:sub(-1), md5:sub(-3, -2), md5)
end

local function purge_one(host, uri)
    local p = path_of(host, uri)
    local ok, err = os.remove(p)
    ngx.log(ngx.INFO, "[PURGE] host=", host, " uri=", uri, " path=", p, " ok=", tostring(ok), " err=", err or "")
end

local function loop()
    while true do
        local red = redis:new()
        red:set_timeouts(1000, 1000, 0)  -- 0 = no read timeout (Pub/Sub)
        local ok, err = red:connect(os.getenv("REDIS_HOST") or "redis", tonumber(os.getenv("REDIS_PORT") or 6379))
        if not ok then ngx.log(ngx.ERR, "purge connect: ", err); ngx.sleep(2); goto continue end

        local pwd = os.getenv("REDIS_PASSWORD")
        if pwd and pwd ~= "" then red:auth(pwd) end

        red:subscribe("cdn.purge")
        while true do
            local res, e = red:read_reply()
            if not res then ngx.log(ngx.WARN, "purge read: ", e); break end
            if res[1] == "message" then
                local payload = cjson.decode(res[3] or "{}") or {}
                if payload.host and payload.uri then
                    purge_one(payload.host, payload.uri)
                end
            end
        end
        ::continue::
    end
end

function _M.start()
    -- Worker 0 chạy 1 timer loop; các worker khác im lặng.
    if ngx.worker.id() == 0 then
        ngx.timer.at(0, function() loop() end)
    end
end

return _M
