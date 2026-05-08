-- =============================================================================
-- waf.lua — Web Application Firewall đơn giản: SQLi, XSS, Path traversal,
-- Bad-bot UA, IP blocklist (lấy từ Redis Set "waf:blocklist").
-- =============================================================================
local _M = {}

local SQLI = {
    "union%s+select", "select%s+.-from", "drop%s+table",
    "insert%s+into", "delete%s+from", "or%s+1=1", "0x[0-9a-f]+",
}
local XSS = { "<script", "javascript:", "onerror%s*=", "onload%s*=", "<iframe" }
local TRAV = { "%.%./", "/etc/passwd", "/proc/self/environ" }
local BAD_UA = { "sqlmap", "acunetix", "nikto", "nessus", "fimap", "havij" }

local function match_any(s, patterns)
    if not s then return false end
    s = string.lower(s)
    for _, p in ipairs(patterns) do
        if string.find(s, p) then return true end
    end
    return false
end

local function deny(reason)
    ngx.log(ngx.WARN, "[WAF] block ", reason, " ip=", ngx.var.remote_addr,
                     " host=", ngx.var.host, " uri=", ngx.var.request_uri)
    ngx.status = 403
    ngx.header["Content-Type"] = "application/json"
    ngx.say(string.format('{"error":true,"code":"WAF_BLOCK","reason":"%s"}', reason))
    return ngx.exit(403)
end

function _M.run()
    local uri  = ngx.var.request_uri or ""
    local args = ngx.var.args or ""
    local ua   = ngx.var.http_user_agent or ""
    local body = ""
    if ngx.req.get_method() ~= "GET" then
        ngx.req.read_body()
        body = ngx.req.get_body_data() or ""
    end
    local target = uri .. "?" .. args .. " " .. body

    if match_any(target, SQLI) then return deny("sqli") end
    if match_any(target, XSS)  then return deny("xss")  end
    if match_any(target, TRAV) then return deny("path_traversal") end
    if match_any(ua,     BAD_UA) then return deny("bad_bot") end
end

return _M
