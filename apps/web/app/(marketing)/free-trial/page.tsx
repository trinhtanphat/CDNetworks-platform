import FreeTrialForm from '@/components/FreeTrialForm';

export const metadata = { title: 'Free Trial — CDNetworks Platform' };

export default function FreeTrialPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Cột giới thiệu */}
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
            Dùng thử 14 ngày — toàn bộ Platform
          </h1>
          <p className="mt-4 text-slate-600">
            Truy cập tất cả module: Web Performance, Cloud Security, Edge Computing.
            Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
          </p>

          <ul className="mt-8 space-y-3 text-slate-700">
            {[
              '50 GB traffic miễn phí qua CDN',
              'WAF + DDoS Standard included',
              '1 Edge Function (1M invocations)',
              'Dashboard + Real-time analytics',
              'Email support 8x5',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Cột form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Đăng ký tài khoản dùng thử</h2>
          <p className="mt-1 text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <a href="https://console-cdnetworks.vnso.vn" className="text-brand">
              Đăng nhập
            </a>
          </p>
          <div className="mt-6">
            <FreeTrialForm />
          </div>
        </div>
      </div>
    </section>
  );
}
