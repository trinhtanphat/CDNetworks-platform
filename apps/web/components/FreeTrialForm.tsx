'use client';

import { FormEvent, useState } from 'react';

type FormState = {
  fullName: string;
  workEmail: string;
  company: string;
  phone: string;
  country: string;
  product: string;
  agree: boolean;
};

const INITIAL: FormState = {
  fullName: '',
  workEmail: '',
  company: '',
  phone: '',
  country: 'VN',
  product: 'web-performance',
  agree: false,
};

/**
 * FreeTrialForm — đăng ký dùng thử 14 ngày.
 * Validate cơ bản phía client; submit POST /api/v1/leads/free-trial.
 */
export default function FreeTrialForm() {
  const [data, setData] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation tối thiểu
    if (!data.fullName.trim()) return setError('Vui lòng nhập họ tên.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail)) return setError('Email không hợp lệ.');
    if (!data.company.trim()) return setError('Vui lòng nhập tên công ty.');
    if (!data.agree) return setError('Bạn cần đồng ý điều khoản dịch vụ.');

    try {
      setStatus('submitting');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/v1/leads/free-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
    }
  }

  if (status === 'ok') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-emerald-800">
        <h3 className="text-xl font-bold">Đăng ký thành công 🎉</h3>
        <p className="mt-2">
          Chúng tôi đã gửi link kích hoạt tài khoản dùng thử đến <b>{data.workEmail}</b>.
          Vui lòng kiểm tra email trong vòng 5 phút.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Họ và tên *">
          <input className={inputCls} value={data.fullName} onChange={(e) => set('fullName', e.target.value)} required />
        </Field>
        <Field label="Email công việc *">
          <input type="email" className={inputCls} value={data.workEmail} onChange={(e) => set('workEmail', e.target.value)} required />
        </Field>
        <Field label="Công ty *">
          <input className={inputCls} value={data.company} onChange={(e) => set('company', e.target.value)} required />
        </Field>
        <Field label="Số điện thoại">
          <input className={inputCls} value={data.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Quốc gia">
          <select className={inputCls} value={data.country} onChange={(e) => set('country', e.target.value)}>
            <option value="VN">Việt Nam</option>
            <option value="SG">Singapore</option>
            <option value="JP">Japan</option>
            <option value="US">United States</option>
            <option value="OTHER">Khác</option>
          </select>
        </Field>
        <Field label="Sản phẩm quan tâm">
          <select className={inputCls} value={data.product} onChange={(e) => set('product', e.target.value)}>
            <option value="web-performance">Web Performance</option>
            <option value="cloud-security">Cloud Security</option>
            <option value="edge-computing">Edge Computing</option>
            <option value="all">Tất cả</option>
          </select>
        </Field>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={data.agree}
          onChange={(e) => set('agree', e.target.checked)}
          className="mt-0.5"
        />
        Tôi đồng ý với{' '}
        <a href="/legal/terms" className="text-brand hover:underline">
          Điều khoản dịch vụ
        </a>{' '}
        và{' '}
        <a href="/legal/privacy" className="text-brand hover:underline">
          Chính sách bảo mật
        </a>
        .
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-md bg-brand py-3 font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-60"
      >
        {status === 'submitting' ? 'Đang gửi…' : 'Bắt đầu dùng thử 14 ngày'}
      </button>
    </form>
  );
}

const inputCls =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
