/**
 * CDNetworks-inspired design tokens.
 * Palette: navy + accent orange/red, dense table, professional density.
 * Áp dụng qua AntD ConfigProvider + CSS variables.
 */
export const cdnTokens = {
  // Core palette
  navy:       '#0b1f3a',
  navyDeep:   '#081831',
  navySoft:   '#112a4d',
  accent:     '#ff4d2e',
  accentSoft: '#ffb020',
  ink:        '#1d2939',
  muted:      '#667085',
  line:       '#e4e7ec',
  surface:    '#ffffff',
  surfaceAlt: '#f8fafc',
  // States
  success:    '#12b76a',
  warning:    '#f79009',
  error:      '#f04438',
  info:       '#0ba5ec',
};

export const antdTheme = {
  token: {
    colorPrimary:  cdnTokens.navy,
    colorInfo:     cdnTokens.info,
    colorSuccess:  cdnTokens.success,
    colorWarning:  cdnTokens.warning,
    colorError:    cdnTokens.error,
    colorLink:     cdnTokens.accent,
    colorTextBase: cdnTokens.ink,
    colorBgBase:   cdnTokens.surface,
    borderRadius:  6,
    controlHeight: 34,
    fontFamily:    'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize:      13,
    wireframe:     false,
  },
  components: {
    Layout: {
      headerBg:    cdnTokens.navy,
      headerColor: '#ffffff',
      siderBg:     '#0f253f',
      bodyBg:      cdnTokens.surfaceAlt,
      headerHeight: 56,
    },
    Menu: {
      darkItemBg:               '#0f253f',
      darkSubMenuItemBg:        '#0b1f3a',
      darkItemSelectedBg:       cdnTokens.accent,
      darkItemSelectedColor:    '#ffffff',
      darkItemHoverBg:          'rgba(255,255,255,0.06)',
      darkItemColor:            '#c7d2e2',
      itemHeight:               36,
    },
    Table: {
      headerBg:        '#f1f5f9',
      headerColor:     cdnTokens.navy,
      rowHoverBg:      '#f8fafc',
      cellPaddingBlock: 8,
      cellPaddingInline: 12,
      borderColor:     cdnTokens.line,
    },
    Button: {
      primaryShadow: 'none',
      defaultBorderColor: cdnTokens.line,
    },
    Card: {
      borderRadiusLG: 10,
      headerBg: '#ffffff',
    },
    Tag: { borderRadiusSM: 4 },
    Tabs: {
      itemSelectedColor: cdnTokens.navy,
      inkBarColor:       cdnTokens.accent,
      titleFontSize:     13,
    },
    Breadcrumb: {
      itemColor:        cdnTokens.muted,
      lastItemColor:    cdnTokens.navy,
      separatorColor:   cdnTokens.muted,
    },
    Input: { paddingBlock: 6 },
    Select: { optionSelectedBg: '#eef2f7' },
  },
};
