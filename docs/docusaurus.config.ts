import type { Config } from '@docusaurus/types';
import type { Options as PresetOptions, ThemeConfig } from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'CDNetworks Platform Docs',
  tagline: 'Web Performance · Cloud Security · Edge Computing',
  url: 'https://docs-cdnetworks.vnso.vn',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'trinhtanphat',
  projectName: 'CDNetworks-platform',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // ----- i18n: en (default) + vi --------------------------------------------
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi'],
    localeConfigs: {
      en: { label: 'English',     direction: 'ltr', htmlLang: 'en-US' },
      vi: { label: 'Tiếng Việt', direction: 'ltr', htmlLang: 'vi-VN' },
    },
  },

  markdown: { mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/trinhtanphat/CDNetworks-platform/edit/main/docs/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
        sitemap: { changefreq: 'weekly', priority: 0.5 },
      } satisfies PresetOptions,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: { defaultMode: 'light', respectPrefersColorScheme: true },
    docs: { sidebar: { autoCollapseCategories: true, hideable: true } },
    navbar: {
      title: 'CDNetworks Docs',
      logo: { alt: 'CDN', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'gettingStartedSidebar', position: 'left', label: 'Getting Started' },
        { type: 'docSidebar', sidebarId: 'tutorialsSidebar',      position: 'left', label: 'Tutorials' },
        { type: 'docSidebar', sidebarId: 'apiSidebar',            position: 'left', label: 'API Reference' },
        { type: 'localeDropdown', position: 'right' },
        {
          href: 'https://console.cdnetworks-platform.local',
          label: 'Console',
          position: 'right',
        },
        {
          href: 'https://github.com/your-org/cdnetworks-platform',
          'aria-label': 'GitHub repository',
          className: 'header-github-link',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction',       to: '/getting-started/introduction' },
            { label: 'Download Logs',      to: '/tutorials/how-to-download-access-logs' },
            { label: 'Access Logs API',    to: '/api-reference/access-logs-api' },
          ],
        },
        {
          title: 'Product',
          items: [
            { label: 'Console',     href: 'https://console.cdnetworks-platform.local' },
            { label: 'Free Trial',  href: 'https://cdnetworks-platform.local/free-trial' },
            { label: 'Status',      href: 'https://status.cdnetworks-platform.local' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub',  href: 'https://github.com/your-org/cdnetworks-platform' },
            { label: 'Twitter', href: 'https://twitter.com/cdnetworks' },
            { label: 'Discord', href: 'https://discord.gg/cdnetworks' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} CDNetworks Platform.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'nginx', 'docker'],
    },
    algolia: {
      // Production: thay bằng key DocSearch thực
      appId:  'PLACEHOLDER_APP_ID',
      apiKey: 'PLACEHOLDER_SEARCH_KEY',
      indexName: 'cdnetworks-platform',
      contextualSearch: true,
    },
  } satisfies ThemeConfig,
};

export default config;
