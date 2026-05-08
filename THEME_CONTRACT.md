# Theme Contract — CDNetworks Platform Design System

> Đọc kèm `docs/ARCHITECTURE_REVIEW.md`. File này khoá design token chung
> giữa `apps/web`, `apps/console`, `docs`. Khi đổi token, đổi ở đây trước
> rồi sync xuống các app.

## 1. Color tokens

| Token              | Giá trị      | Dùng cho                              |
|--------------------|--------------|----------------------------------------|
| `--cdn-primary`    | `#0a4cff`    | Primary button, link, focus ring       |
| `--cdn-primary-2`  | `#00c8b8`    | Gradient end, success accent           |
| `--cdn-bg-dark`    | `#0b1220`    | Dark hero, login background            |
| `--cdn-text-1`     | `#0f172a`    | Heading                                |
| `--cdn-text-2`     | `#475569`    | Body text                              |
| `--cdn-muted`      | `#64748b`    | Caption, helper text                   |
| `--cdn-border`     | `#e2e8f0`    | Card, table border                     |
| `--cdn-success`    | `#10b981`    |                                         |
| `--cdn-warning`    | `#f59e0b`    |                                         |
| `--cdn-danger`     | `#ef4444`    |                                         |

Gradient nhãn: `linear-gradient(120deg, #0a4cff 0%, #00c8b8 100%)`.

## 2. Typography

- Sans: `Inter, "Helvetica Neue", Arial, sans-serif`
- Mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace`
- Heading scale: 32 / 24 / 20 / 16 / 14 (line-height 1.25–1.5)

## 3. Spacing scale

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64` (px) — tương đương Tailwind 1/2/3/4/5/6/8/10/12/16.

## 4. Component tokens

| Component        | Quy ước                                                |
|------------------|---------------------------------------------------------|
| Button primary   | bg gradient, color #fff, height 36 (default) / 40 (lg) |
| Card             | radius 12, shadow `0 6px 24px rgba(15,23,42,.08)`      |
| Sidebar product rail | width 64, item height 56, icon 24, tooltip right    |
| Sidebar detail   | width 240, item padding 12 16, indent submenu 12       |
| Topbar           | height 56, blur backdrop, search width 280             |

## 5. Iconography

- Primary: `@ant-design/icons` v5 (console).
- Marketing: lucide-react cho pages tĩnh.
- Logo CDNetworks-platform: chữ "C" trong square gradient 48×48 r=12.

## 6. Motion

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-quint).
- Duration: 150ms (micro), 250ms (panel), 400ms (page).
- Tôn trọng `prefers-reduced-motion` — disable tất cả animation > 200ms.

## 7. A11y baselines

- Contrast tối thiểu AA (4.5:1) cho text < 18px.
- Focus ring 2px solid `--cdn-primary` + offset 2px.
- Tab order phải khớp visual order; bẫy focus trong modal.
