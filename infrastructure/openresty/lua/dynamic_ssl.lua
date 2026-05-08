-- =============================================================================
-- dynamic_ssl.lua — Load SSL certificate động theo SNI từ Redis.
-- Key Redis: ssl:cert:<hostname> = PEM cert, ssl:key:<hostname> = PEM key.
-- =============================================================================
local _M = {}

local ssl    = require("ngx.ssl")
local redis  = require("resty.redis")

local CERT_CACHE = ngx.shared.cert_cache
local CACHE_TTL  = 300  -- 5 phút local cache để giảm tải Redis

local function fetch_from_redis(name)
    local red = redis:new()
    red:set_timeouts(200, 500, 500)
    local ok, err = red:connect(os.getenv("REDIS_HOST") or "redis", tonumber(os.getenv("REDIS_PORT") or 6379))
    if not ok then
        ngx.log(ngx.ERR, "redis connect: ", err)
        return nil
    end
    local pwd = os.getenv("REDIS_PASSWORD")
    if pwd and pwd ~= "" then red:auth(pwd) end

    local cert, e1 = red:get("ssl:cert:" .. name)
    local key,  e2 = red:get("ssl:key:"  .. name)
    red:set_keepalive(10000, 100)

    if cert == ngx.null or key == ngx.null then return nil end
    return cert, key
end

function _M.load()
    local sni, err = ssl.server_name()
    if not sni then return end

    local cached = CERT_CACHE:get(sni)
    local cert_pem, key_pem
    if cached then
        cert_pem, key_pem = cached:match("^(.-)\30(.*)$")
    else
        cert_pem, key_pem = fetch_from_redis(sni)
        if cert_pem and key_pem then
            CERT_CACHE:set(sni, cert_pem .. "\30" .. key_pem, CACHE_TTL)
        end
    end

    if not cert_pem or not key_pem then
        ngx.log(ngx.WARN, "SNI ", sni, " no cert in Redis — fallback")
        return
    end

    local der_cert, e1 = ssl.cert_pem_to_der(cert_pem)
    local der_key,  e2 = ssl.priv_key_pem_to_der(key_pem)
    if not der_cert or not der_key then
        ngx.log(ngx.ERR, "PEM→DER fail: ", e1 or e2)
        return
    end

    ssl.clear_certs()
    ssl.set_der_cert(der_cert)
    ssl.set_der_priv_key(der_key)
end

return _M
