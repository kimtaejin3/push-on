import type {FontRole, FontWeight} from './fonts';

export type TextVariant =
  | 'display'
  | 'hero'
  | 'title'
  | 'headline'
  | 'body'
  | 'label'
  | 'caption';

export const textVariants: Record<
  TextVariant,
  {fontSize: number; lineHeight: number; weight: FontWeight; role: FontRole}
> = {
  display: {fontSize: 220, lineHeight: 187, weight: 900, role: 'num'},
  hero: {fontSize: 96, lineHeight: 86, weight: 800, role: 'num'},
  title: {fontSize: 28, lineHeight: 36, weight: 800, role: 'ko'},
  headline: {fontSize: 22, lineHeight: 30, weight: 700, role: 'ko'},
  body: {fontSize: 16, lineHeight: 22, weight: 500, role: 'ko'},
  label: {fontSize: 14, lineHeight: 20, weight: 600, role: 'ko'},
  caption: {fontSize: 13, lineHeight: 18, weight: 500, role: 'ko'},
};
