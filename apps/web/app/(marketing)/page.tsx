import HeroBanner from '@/components/HeroBanner';
import ServiceGrid from '@/components/ServiceGrid';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <ServiceGrid />

      {/* Trust strip */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
            Hơn 10.000 doanh nghiệp tin dùng
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-70">
            {['Acme', 'Globex', 'Soylent', 'Initech', 'Umbrella', 'Hooli'].map((b) => (
              <div key={b} className="text-xl font-bold text-slate-400">{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA cuối */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Sẵn sàng tăng tốc?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Đăng ký dùng thử 14 ngày, không cần thẻ tín dụng. Triển khai PoP đầu tiên trong dưới 5 phút.
        </p>
        <a
          href="/free-trial"
          className="mt-6 inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white shadow hover:bg-brand-dark"
        >
          Bắt đầu ngay →
        </a>
      </section>
    </>
  );
}
