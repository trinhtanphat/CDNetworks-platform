export type BrandingConfig = {
  companyName: string;
  portalTitle: string;
  logoUrl: string;
  socialLogoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
};

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'CDNetworks Platform',
  portalTitle: 'Customer Portal',
  logoUrl: '/logo.png',
  socialLogoUrl: '/logo-social-2024.png',
  faviconUrl: '/favicon-32x32.png',
  primaryColor: '#0a4cff',
  accentColor: '#00c8b8',
};

const BRANDING_KEY = 'cdn_branding_config';
const BRANDING_EVENT = 'cdn_branding_updated';

export function getBranding(): BrandingConfig {
  try {
    const raw = localStorage.getItem(BRANDING_KEY);
    if (!raw) return DEFAULT_BRANDING;
    return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function saveBranding(config: BrandingConfig) {
  localStorage.setItem(BRANDING_KEY, JSON.stringify(config));
  applyBranding(config);
  window.dispatchEvent(new Event(BRANDING_EVENT));
}

export function resetBranding() {
  localStorage.removeItem(BRANDING_KEY);
  applyBranding(DEFAULT_BRANDING);
  window.dispatchEvent(new Event(BRANDING_EVENT));
}

export function subscribeBranding(callback: () => void) {
  window.addEventListener(BRANDING_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(BRANDING_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function applyBranding(config = getBranding()) {
  document.documentElement.style.setProperty('--cdn-primary', config.primaryColor);
  document.documentElement.style.setProperty('--cdn-accent', config.accentColor);
  document.title = `${config.companyName} · Console`;

  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = config.faviconUrl;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
