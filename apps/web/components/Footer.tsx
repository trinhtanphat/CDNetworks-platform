import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 text-sm md:grid-cols-4">
        <div>
          <div className="text-base font-bold">CDNetworks</div>
          <p className="mt-2 text-slate-500">
            Mạng phân phối nội dung & nền tảng edge toàn cầu.
          </p>
        </div>
        <div>
          <div className="font-semibold">Sản phẩm</div>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/products/app-acceleration">Web Performance</Link></li>
            <li><Link href="/products/waf">Cloud Security</Link></li>
            <li><Link href="/products/edge-functions">Edge Computing</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Tài nguyên</div>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/docs">Documentation</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/support">Support</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Công ty</div>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/legal/privacy">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CDNetworks. All rights reserved.
      </div>
    </footer>
  );
}
