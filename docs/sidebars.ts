import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * 3 sidebar tách biệt cho 3 mục Navbar:
 *  - Getting Started
 *  - Tutorials
 *  - API Reference
 */
const sidebars: SidebarsConfig = {
  gettingStartedSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['getting-started/introduction'],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      collapsed: false,
      items: ['infrastructure/full-stack-deployment'],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/logical-architecture',
        'architecture/physical-topology',
        'architecture/network',
        'architecture/capacity-planning',
        'architecture/observability',
        'architecture/security',
        'architecture/dr-bcp',
        'architecture/runbook',
        'architecture/operations',
        'architecture/roadmap',
      ],
    },
  ],

  tutorialsSidebar: [
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: ['tutorials/how-to-download-access-logs'],
    },
  ],

  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: ['api-reference/access-logs-api'],
    },
  ],
};

export default sidebars;
