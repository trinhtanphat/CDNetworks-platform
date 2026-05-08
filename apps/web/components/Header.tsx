'use client';

/**
 * Header — Mega menu + i18n + nút Login / Free Trial.
 * Layout phỏng theo cdnetworks.com: logo trái, nav giữa, hành động phải.
 */
import Link from 'next/link';
import { useState } from 'react';

type MenuKey = 'web-performance' | 'cloud-security' | 'edge-computing' | null;

const MEGA_MENU: Record<Exclude<MenuKey, null>, { title: string; items: { name: string; href: string; desc: string }[] }> = {
  'web-performance': {
    title: 'Web Performance',
    items: [
      { name: 'Application Acceleration', href: '/products/app-acceleration', desc: 'Tăng tốc dynamic content cho web/app.' },
      { name: 'Dynamic Web Acceleration', href: '/products/dynamic-acceleration', desc: 'Route động & TCP optimization.' },
      { name: 'Content Acceleration', href: '/products/content-acceleration', desc: 'CDN tĩnh + image optimization.' },
      { name: 'Media Acceleration', href: '/products/media-acceleration', desc: 'Live + VOD streaming toàn cầu.' },
    ],
  },
  'cloud-security': {
    title: 'Cloud Security',
    items: [
      { name: 'Application Shield (WAF)', href: '/products/waf', desc: 'WAF + Bot management.' },
      { name: 'Flood Shield (DDoS)', href: '/products/ddos', desc: 'Chống DDoS L3/L4/L7.' },
      { name: 'Bot Shield', href: '/products/bot-shield', desc: 'Phát hiện bot bằng ML.' },
      { name: 'API Shield', href: '/products/api-shield', desc: 'Bảo vệ REST/GraphQL API.' },
    ],
  },
  'edge-computing': {
    title: 'Edge Computing',
    items: [
      { name: 'Edge Functions', href: '/products/edge-functions', desc: 'Serverless tại biên.' },
      { name: 'Edge Containers', href: '/products/edge-containers', desc: 'Container ngay tại PoP.' },
      { name: 'IoT Acceleration', href: '/products/iot', desc: 'Thiết bị IoT toàn cầu.' },
    ],
  },
};

export default function Header() {
  const [open, setOpen] = useState<MenuKey>(null);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-8 w-8 rounded cdn-gradient" />
          <span className="text-lg font-bold tracking-tight">CDNetworks</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {(Object.keys(MEGA_MENU) as Exclude<MenuKey, null>[]).map((key) => (
            <button
              key={key}
              onMouseEnter={() => setOpen(key)}
              onMouseLeave={() => setOpen(null)}
              onFocus={() => setOpen(key)}
              className="hover:text-brand transition-colors"
            >
              {MEGA_MENU[key].title}
            </button>
          ))}
          <Link href="/pricing" className="hover:text-brand">Pricing</Link>
          <Link href="/docs" className="hover:text-brand">Docs</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language switcher đơn giản */}
          <select
            aria-label="Language"
            className="hidden sm:block rounded border border-slate-300 px-2 py-1 text-sm"
            defaultValue="en"
          >
            <option value="en">EN</option>
            <option value="vi">VI</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
          <Link
            href="https://console.cdnetworks-platform.local"
            className="text-sm font-medium text-slate-700 hover:text-brand"
          >
            Login
          </Link>
          <Link
            href="/free-trial"
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark transition"
          >
            Free Trial
          </Link>
        </div>
      </div>

      {/* Mega-menu panel */}
      {open && (
        <div
          onMouseEnter={() => setOpen(open)}
          onMouseLeave={() => setOpen(null)}
          className="border-t border-slate-200 bg-white shadow-lg"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
            {MEGA_MENU[open].items.map((it) => (
              <Link key={it.href} href={it.href} className="group">
                <div className="font-semibold text-slate-900 group-hover:text-brand">{it.name}</div>
                <div className="mt-1 text-sm text-slate-500">{it.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
