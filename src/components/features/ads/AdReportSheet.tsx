import React from 'react';
import {StyleSheet} from 'react-native';
import {space} from '../../../theme';
import {Button} from '../../ui/Button';
import {BottomSheet} from '../../ui/feedback/BottomSheet';
import {Text} from '../../ui/Text';

interface AdReportSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** 설정 "광고 신고하기" — 광고를 신고하는 방법을 알려 주는 시트 */
export function AdReportSheet({visible, onClose}: AdReportSheetProps) {
  return (
    <BottomSheet visible={visible} title="광고 신고하기" onClose={onClose}>
      <Text variant="label" color="textMuted" style={styles.body}>
        광고 오른쪽 위 ⓘ 를 누르면 Google 에 바로 신고할 수 있어요. 문제가
        계속되면 문의하기로 알려 주세요.
      </Text>
      <Button variant="primary" title="닫기" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {marginBottom: space[12]},
});
