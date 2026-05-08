# =============================================================================
# Terraform — multi-cloud Anycast / GeoDNS edge cho CDNetworks Platform.
# - Cloudflare làm anycast frontdoor (ngon, miễn phí cho L7).
# - AWS Route 53 GeoDNS routing (failover) khi muốn full self-host.
# - Hetzner / DigitalOcean PoP cho compute.
# =============================================================================
terraform {
  required_version = ">= 1.6"
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.0" }
    aws        = { source = "hashicorp/aws",        version = "~> 5.0" }
    hetzner    = { source = "hetznercloud/hcloud",  version = "~> 1.45" }
  }
  backend "s3" {
    bucket = "vnso-tfstate"
    key    = "cdnetworks-platform/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

# ----------------- Cloudflare: zone + WAF + DNS -------------------------------
resource "cloudflare_zone" "main" {
  zone = var.root_domain   # vnso.vn
  plan = "pro"
}

# Anycast hostnames qua Cloudflare proxy (orange cloud)
locals {
  hostnames = {
    "cdnetworks.vnso.vn"          = { proxied = true,  ttl = 1 }
    "console-cdnetworks.vnso.vn"  = { proxied = true,  ttl = 1 }
    "edge-pop.vnso.vn"            = { proxied = false, ttl = 60 }   # bypass CF cho health-check
  }
}

resource "cloudflare_record" "edge" {
  for_each = local.hostnames
  zone_id  = cloudflare_zone.main.id
  name     = each.key
  content  = var.edge_anycast_ip
  type     = "A"
  proxied  = each.value.proxied
  ttl      = each.value.ttl
}

# Cloudflare WAF managed rules (OWASP + Cloudflare Specials)
resource "cloudflare_ruleset" "waf" {
  zone_id = cloudflare_zone.main.id
  name    = "cdnetworks-waf"
  kind    = "zone"
  phase   = "http_request_firewall_managed"

  rules {
    action      = "execute"
    description = "Cloudflare Managed Ruleset"
    expression  = "true"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee"   # Cloudflare Managed
    }
  }
  rules {
    action      = "execute"
    description = "OWASP Core Ruleset"
    expression  = "true"
    action_parameters {
      id = "4814384a9e5d4991b9815dcfc25d2f1f"   # OWASP
    }
  }
}

# Rate limit ở Cloudflare edge (L7) — chặn flooders trước khi tới origin
resource "cloudflare_rate_limit" "login" {
  zone_id   = cloudflare_zone.main.id
  threshold = 10
  period    = 60
  match {
    request {
      url_pattern = "console-cdnetworks.vnso.vn/api/v1/auth/login"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  action {
    mode    = "ban"
    timeout = 600
  }
}

# ----------------- AWS Route 53 GeoDNS (multi-region failover) ---------------
resource "aws_route53_zone" "primary" { name = var.root_domain }

resource "aws_route53_health_check" "edge_sg" {
  fqdn              = "edge-sg.vnso.vn"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/healthz"
  failure_threshold = 3
  request_interval  = 30
  tags = { Name = "edge-sg-healthcheck" }
}

resource "aws_route53_record" "geo_apac" {
  zone_id        = aws_route53_zone.primary.zone_id
  name           = "edge.${var.root_domain}"
  type           = "A"
  set_identifier = "apac"
  geolocation_routing_policy { continent = "AS" }
  ttl            = 60
  records        = [var.edge_ip_singapore]
  health_check_id = aws_route53_health_check.edge_sg.id
}

resource "aws_route53_record" "geo_eu" {
  zone_id        = aws_route53_zone.primary.zone_id
  name           = "edge.${var.root_domain}"
  type           = "A"
  set_identifier = "eu"
  geolocation_routing_policy { continent = "EU" }
  ttl            = 60
  records        = [var.edge_ip_frankfurt]
}

resource "aws_route53_record" "geo_default" {
  zone_id        = aws_route53_zone.primary.zone_id
  name           = "edge.${var.root_domain}"
  type           = "A"
  set_identifier = "default"
  geolocation_routing_policy { country = "*" }
  ttl            = 60
  records        = [var.edge_ip_singapore]
}

# ----------------- Hetzner PoP nodes ----------------------------------------
resource "hcloud_server" "edge" {
  for_each    = toset(var.edge_locations)   # ["nbg1","ash","sin"]
  name        = "edge-${each.key}"
  server_type = "cpx31"
  location    = each.key
  image       = "debian-12"
  ssh_keys    = [var.ssh_key_id]
  user_data   = file("${path.module}/cloud-init/edge.yaml")
  labels      = { role = "edge", cluster = "cdnetworks" }
}

variable "root_domain"         { default = "vnso.vn" }
variable "edge_anycast_ip"     {}
variable "edge_ip_singapore"   {}
variable "edge_ip_frankfurt"   {}
variable "edge_locations"      { default = ["nbg1", "ash", "sin"] }
variable "ssh_key_id"          {}

output "nameservers" { value = cloudflare_zone.main.name_servers }
