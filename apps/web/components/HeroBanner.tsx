import Link from 'next/link';

/** Hero Banner trang chủ — tone tham khảo cdnetworks.com. */
export default function HeroBanner() {
  return (
    <section className="cdn-gradient text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
          Global Edge Network · 2,800+ PoPs · 70+ countries
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
          Tăng tốc, bảo mật và mở rộng ứng dụng của bạn — đến tận biên người dùng.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/90">
          CDNetworks Platform mang lại Web Performance, Cloud Security và Edge
          Computing trên cùng một control plane. Triển khai chỉ trong vài phút.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/free-trial"
            className="rounded-md bg-white px-6 py-3 font-semibold text-brand-dark shadow hover:bg-slate-100"
          >
            Bắt đầu miễn phí 14 ngày
          </Link>
          <Link
            href="/contact-sales"
            className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Liên hệ sales
          </Link>
        </div>
      </div>
    </section>
  );
}
