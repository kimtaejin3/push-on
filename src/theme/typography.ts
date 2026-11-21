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
  {fontSize: number; weight: FontWeight; role: FontRole}
> = {
  display: {fontSize: 220, weight: 900, role: 'num'},
  hero: {fontSize: 96, weight: 800, role: 'num'},
  title: {fontSize: 28, weight: 800, role: 'ko'},
  headline: {fontSize: 22, weight: 700, role: 'ko'},
  body: {fontSize: 16, weight: 500, role: 'ko'},
  label: {fontSize: 14, weight: 600, role: 'ko'},
  caption: {fontSize: 13, weight: 500, role: 'ko'},
};
