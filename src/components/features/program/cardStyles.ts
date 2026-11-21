import {StyleSheet} from 'react-native';
import {colors} from '../../../constants/colors';

/** 프로그램 화면 카드들이 같이 쓰는 스타일 */
export const cardStyles = StyleSheet.create({
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, padding: 24, gap: 12},
  heading: {fontSize: 22, fontWeight: '600', color: colors.textLight},
  sets: {fontSize: 28, fontWeight: 'bold', color: colors.textLight, marginVertical: 4},
  body: {fontSize: 15, lineHeight: 22, color: colors.textSecondary},
  hint: {fontSize: 13, lineHeight: 19, color: colors.gray400},
  emphasis: {fontSize: 14, lineHeight: 21, color: colors.textLight},
  button: {marginTop: 8},
  disabled: {opacity: 0.6},
  link: {textAlign: 'center', fontSize: 14, color: colors.primaryLight, paddingTop: 8},
  warning: {fontSize: 13, color: colors.error, textAlign: 'center'},
  /** 카드 안의 안내 상자 (지난 실패 이유, 하향 권유) */
  callout: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  calloutTitle: {fontSize: 14, lineHeight: 21, fontWeight: '600', color: colors.textLight},
  calloutRow: {fontSize: 14, color: colors.warning},
});
