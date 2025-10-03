export const colors = {
  // Primary
  primary: '#0182ff',
  primaryDark: '#097eed',

  // Text
  textPrimary: '#333333',
  textSecondary: '#666666',
  textLight: '#ffffff',
  textBlack: '#000000',

  // Background
  background: '#ffffff',
  backgroundLight: '#f5f5f5',
  backgroundAccent: '#f0f8ff',

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
  gray900: '#333333',

  // Shadow
  shadow: '#000000',

  // Additional colors found in the project
  lightBlue: '#58a8f5',
  pastelBlue: '#bacfe3',
  tabInactive: '#242424',
  buttonDisabled: '#9faab5',
} as const;

export type ColorKey = keyof typeof colors;
