export const providers = ['google', 'kakao', 'apple'] as const;
export type Provider = typeof providers[number];

export type ProviderIconName = 'comment' | 'search' | 'envelope' | 'apple';
export type ProviderIconStyle = 'solid' | 'brand';

export interface ProviderInfo {
  name: string;
  icon: ProviderIconName;
  iconStyle: ProviderIconStyle;
  color: string;
}
