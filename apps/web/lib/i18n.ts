/**
 * Stub i18n — gắn next-intl/locales sau.
 * Hiện trả về dictionary inline để compile được.
 */
export const locales = ['en', 'vi', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const dictionaries: Record<Locale, Record<string, string>> = {
  en: { 'nav.login': 'Login', 'nav.trial': 'Free Trial' },
  vi: { 'nav.login': 'Đăng nhập', 'nav.trial': 'Dùng thử miễn phí' },
  zh: { 'nav.login': '登录', 'nav.trial': '免费试用' },
  ja: { 'nav.login': 'ログイン', 'nav.trial': '無料体験' },
};

export function t(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? key;
}
