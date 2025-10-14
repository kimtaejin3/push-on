export const colors = {
  // Primary
  primary: '#7D5FFF',
  primaryDark: '#6B46C1',
  primaryLight: '#a294e3',

  // Text
  textPrimary: '#333333',
  textSecondary: '#666666',
  textLight: '#ffffff',
  textBlack: '#000000',

  // Background
  background: '#ffffff',
  backgroundLight: '#f5f5f5',
  backgroundAccent: '#f0f8ff',
  backgroundDark: '#0d0d0d',

  // Status
  success: '#3EB489',
  error: '#ff4444',
  warning: '#FEE500',

  // Neutral
  gray100: '#f0f0f0',
  gray200: '#e9ecef',
  gray300: '#cccccc',
  gray400: '#999999',
  gray500: '#666666',
  gray600: '#757373',
  gray700: '#6e6e6e',
  gray800: '#4f4d4d',
  gray900: '#333333',
  grayLight: '#ededed',

  // Shadow
  shadow: '#000000',

  // Additional colors found in the project
  lightBlue: '#58a8f5',
  pastelBlue: '#bacfe3',
  tabInactive: '#474747',
  buttonDisabled: '#9faab5',

  // Medal colors
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',

  // Transparent overlays
  overlayLight: 'rgba(255, 255, 255, 0.05)',
  overlayMedium: 'rgba(255, 255, 255, 0.1)',
  overlayDark: 'rgba(255, 255, 255, 0.03)',
  primaryOverlay: 'rgba(125, 95, 255, 0.1)',
  primaryOverlayMedium: 'rgba(125, 95, 255, 0.15)',
  primaryBorder: 'rgba(125, 95, 255, 0.2)',
  primaryBorderMedium: 'rgba(125, 95, 255, 0.3)',
} as const;

export type ColorKey = keyof typeof colors;
