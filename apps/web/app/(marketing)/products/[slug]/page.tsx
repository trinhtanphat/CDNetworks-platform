import Link from 'next/link';

const PRODUCTS: Record<string, { name: string; tagline: string; bullets: string[] }> = {
  'app-acceleration':     { name: 'Application Acceleration',     tagline: 'Tăng tốc dynamic content cho web/app trên mạng lưới 2.800+ PoP.',         bullets: ['Dynamic content acceleration', 'TCP / QUIC optimization', 'Origin shield + multi-origin failover'] },
  'dynamic-acceleration': { name: 'Dynamic Web Acceleration',     tagline: 'Định tuyến động + connection pooling tới origin.',                          bullets: ['Real-time route optimization', 'Persistent TLS', 'Header / cookie aware caching'] },
  'content-acceleration': { name: 'Content Acceleration',         tagline: 'CDN tĩnh + image optimization tự động.',                                    bullets: ['Edge cache 2.800+ PoP', 'Image resize / WebP / AVIF', 'Brotli / gzip / minify'] },
  'media-acceleration':   { name: 'Media Acceleration',           tagline: 'Live + VOD streaming toàn cầu, độ trễ thấp.',                              bullets: ['HLS / DASH packager', 'Low-latency live (LL-HLS)', 'DRM ready (Widevine, FairPlay)'] },
  'waf':                  { name: 'Application Shield (WAF)',     tagline: 'WAF chuẩn OWASP Top 10 + bot management AI.',                              bullets: ['Managed rule sets', 'Custom rules + virtual patching', 'API schema validation'] },
  'ddos':                 { name: 'Flood Shield (DDoS)',          tagline: 'Chặn tấn công L3/L4/L7 với scrubbing center toàn cầu.',                    bullets: ['Anycast 15+ Tbps capacity', 'Always-on detection', 'SLA 99.99% mitigation'] },
  'bot-shield':           { name: 'Bot Shield',                   tagline: 'Phát hiện bot bằng ML + device fingerprinting.',                            bullets: ['Good-bot allowlist', 'Credential stuffing protection', 'Scraping mitigation'] },
  'api-shield':           { name: 'API Shield',                   tagline: 'Bảo vệ REST/GraphQL API + schema validation.',                              bullets: ['OpenAPI import', 'Rate limit per token', 'Sensitive data masking'] },
  'edge-functions':       { name: 'Edge Functions',               tagline: 'Chạy code JavaScript/Wasm tại 2.800+ PoP, dưới 50ms cold start.',          bullets: ['V8 isolates', 'KV storage', 'Wasm runtime'] },
  'edge-containers':      { name: 'Edge Containers',              tagline: 'Triển khai container Docker tới biên với một lệnh.',                        bullets: ['OCI compatible', 'Auto-scale per region', 'WireGuard mesh'] },
  'edge-storage':         { name: 'Edge Storage',                 tagline: 'Object storage S3-compatible phân tán toàn cầu.',                           bullets: ['S3 API', 'Geo replication', 'Signed URL + lifecycle'] },
};

export function generateStaticParams() {
  return Object.keys(PRODUCTS).map((slug) => ({ slug }));
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = PRODUCTS[params.slug];
  if (!p) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Sản phẩm không tồn tại</h1>
        <p className="mt-3 text-slate-600">Slug “{params.slug}” chưa được định nghĩa.</p>
        <Link href="/" className="mt-6 inline-block text-brand">← Về trang chủ</Link>
      </section>
    );
  }

  return (
    <article>
      <section className="cdn-gradient text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">Product</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{p.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">{p.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/free-trial" className="rounded-md bg-white px-6 py-3 font-bold text-brand-dark hover:bg-slate-100">
              Dùng thử miễn phí
            </Link>
            <Link href="/document" className="rounded-md border-2 border-white px-6 py-3 font-bold text-white hover:bg-white/10">
              Xem tài liệu
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold">Tính năng nổi bật</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {p.bullets.map((b) => (
            <li key={b} className="rounded-lg border border-slate-200 p-5 text-slate-700 shadow-sm">
              <span className="text-brand">✓</span> <span className="ml-1 font-medium">{b}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
