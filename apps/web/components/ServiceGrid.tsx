import Link from 'next/link';

type Service = {
  title: string;
  desc: string;
  href: string;
  bullets: string[];
  icon: string; // emoji placeholder, có thể swap bằng <svg>
};

const SERVICES: Service[] = [
  {
    title: 'Web Performance',
    desc: 'Tăng tốc website và ứng dụng động trên mạng lưới toàn cầu.',
    href: '/products/app-acceleration',
    icon: '⚡',
    bullets: ['Application Acceleration', 'Dynamic Web Acceleration', 'Image & Media CDN'],
  },
  {
    title: 'Cloud Security',
    desc: 'WAF, chống DDoS, bot management và API protection.',
    href: '/products/waf',
    icon: '🛡️',
    bullets: ['Application Shield (WAF)', 'Flood Shield (DDoS)', 'Bot Shield', 'API Shield'],
  },
  {
    title: 'Edge Computing',
    desc: 'Chạy code và container ngay tại PoP gần người dùng.',
    href: '/products/edge-functions',
    icon: '🌐',
    bullets: ['Edge Functions', 'Edge Containers', 'IoT Acceleration'],
  },
];

export default function ServiceGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold md:text-4xl">
        Một nền tảng — ba tầng giá trị
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
        Mọi sản phẩm dùng chung dashboard, billing và API — không cần tích hợp lẻ tẻ.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {SERVICES.map((s) => (
          <article
            key={s.title}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
          >
            <div className="text-4xl">{s.icon}</div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-slate-600">{s.desc}</p>
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href={s.href}
              className="mt-6 inline-flex items-center text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Tìm hiểu thêm →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
