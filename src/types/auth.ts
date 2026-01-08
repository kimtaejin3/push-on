export const providers = ['google', 'kakao'] as const;
export type ProviderIconName = 'comment' | 'search' | 'envelope';
export interface ProviderInfo {
    name: string;
    icon: ProviderIconName;
    color: string;
  }

